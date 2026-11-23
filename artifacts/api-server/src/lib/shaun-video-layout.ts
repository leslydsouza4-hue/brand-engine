import { ai } from "@workspace/integrations-gemini-ai";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { layoutFrame, splitSchema, cropBoxSchema, extractGridFrames, FRAME_GRID_FPS } from "./shaun-video-render";
import { SessionError } from "./session-validation";
import { greetingScenes } from "./shaun-greeting-scenes";
import { excludeWebcam } from "./shaun-screen-crop";
import { presenterMotionFromStills, snapSpeakerToMotion } from "./shaun-camera-refine";
import sharp from "sharp";

/** Gemini parts from stills already on disk (one decode pass, see extractGridFrames). */
async function partsFromStills(times: number[], files: string[]) {
  return Promise.all(times.map(async (time, i) => [{text:`Source time ${time.toFixed(3)} seconds`},
    {inlineData:{data:(await readFile(files[i])).toString("base64"),mimeType:"image/jpeg"}}])).then(p => p.flat()) as Promise<Array<{text: string} | {inlineData: {data:string; mimeType:string}}>>;
}
async function frames(input: string, dir: string, times: number[]) {
  const parts: Array<{text: string} | {inlineData: {data:string; mimeType:string}}> = [];
  // Bound decoder concurrency; seek directly rather than decoding the entire source.
  for (let i=0;i<times.length;i+=2) {
    const batch = await Promise.all(times.slice(i,i+2).map(async (time,j) => {
      const path=join(dir,`analysis-${i+j}.jpg`);
      await layoutFrame(input,path,time);
      return [{text:`Source time ${time.toFixed(3)} seconds`},{inlineData:{data:(await readFile(path)).toString("base64"),mimeType:"image/jpeg"}}];
    }));
    parts.push(...batch.flat());
  }
  return parts;
}
const boxJson={type:"object",properties:Object.fromEntries(["x","y","width","height"].map(k=>[k,{type:"number",minimum:0,maximum:1,description:"Normalized fraction of FULL image, between 0 and 1. NOT pixels or percentages."}])),required:["x","y","width","height"],additionalProperties:false};
async function inspect(parts: Awaited<ReturnType<typeof frames>>, text: string, privacy=false) {
  const entry=privacy ? {type:"object",properties:{boxes:{type:"array",items:boxJson}},required:["boxes"]} :
    {type:"object",properties:{mode:{type:"string",enum:["speaker","split"]},split:{type:"object",properties:{speaker:boxJson,screen:boxJson,speakerHead:boxJson,speakerShape:{type:"string",enum:["circle","rectangle"]}},required:["speaker","screen","speakerShape","speakerHead"]}},required:["mode","split"]};
  const response=await ai.models.generateContent({model:"gemini-3.8-flash",config:{thinkingConfig:{thinkingBudget:0},responseMimeType:"application/json",responseJsonSchema:{type:"object",properties:{frames:{type:"array",items:entry}},required:["frames"]},httpOptions:{timeout:45000}},contents:[{role:"user",parts:[...parts,{text}]}]});
  const parsed=JSON.parse(response.text || "{}");
  // Clip valid normalized rectangles to the image edge. Do not reinterpret pixels.
  const clip=(box: Record<string,unknown>)=>{
    if(["x","y","width","height"].every(k=>typeof box[k]==="number" && Number.isFinite(box[k]) && (box[k] as number)>=0 && (box[k] as number)<=1)){
      box.width=Math.min(box.width as number,1-(box.x as number));
      box.height=Math.min(box.height as number,1-(box.y as number));
    }
  };
  for(const frame of (Array.isArray(parsed)?parsed:parsed.frames) ?? []){
    if(frame.split?.speaker) clip(frame.split.speaker);
    if(frame.split?.screen) clip(frame.split.screen);
    if(frame.split?.speakerHead) clip(frame.split.speakerHead);
    for(const box of frame.boxes ?? []) clip(box);
  }
  // Some model responses use the requested frames as the root array.
  return Array.isArray(parsed) ? {frames:parsed} : parsed;
}
type Box={x:number;y:number;width:number;height:number};
const area=(b:Box)=>b.width*b.height;
const centreInside=(inner:Box,outer:Box)=>{
  const cx=inner.x+inner.width/2, cy=inner.y+inner.height/2;
  return cx>=outer.x && cx<=outer.x+outer.width && cy>=outer.y && cy<=outer.y+outer.height;
};
/** Dense samples where Descript videos switch layout (greeting, outro), sparse through the demo.
 * Avoid t≈0: fades/black first frames produce garbage presenter bounds. */
export function layoutSampleTimes(duration:number):number[] {
  const last=Math.max(0,duration-0.25);
  const clamp=(t:number)=>Math.max(0,Math.min(last,t));
  let times:number[];
  if(duration<24) {
    const count=Math.min(10,Math.max(3,Math.ceil(duration/2)));
    times=Array.from({length:count},(_,i)=>clamp(Math.min(1,duration*0.05)+i*(last-Math.min(1,duration*0.05))/(count-1)));
  } else {
    const opening=[1,2.5,4,5.5,7,9,12];
    const closing=[duration-8,duration-5,duration-3,duration-1];
    const middle=Array.from({length:6},(_,i)=>12+(i+1)*(duration-20)/7);
    times=[...opening,...middle,...closing].map(clamp);
  }
  return [...new Set(times.map(t=>Math.round(t*1000)/1000))].sort((a,b)=>a-b);
}
type DetectedFrame={mode:"speaker"|"split";split:z.infer<typeof splitSchema>};
/** Reject presenter bounds that cannot contain Shaun, and relabel a small webcam called "speaker". */
export function sanitizeLayoutFrame(f:DetectedFrame):DetectedFrame|null {
  const s=f.split;
  if(s.speakerHead && !centreInside(s.speakerHead,s.speaker)) return null;
  if(f.mode==="speaker") {
    if(area(s.speaker)>=0.2) return f;
    const screen=excludeWebcam(s.screen,s.speaker);
    return screen && area(screen)>=0.1 ? {mode:"split",split:{...s,screen}} : null;
  }
  const screen=excludeWebcam(s.screen,s.speaker);
  return screen ? {mode:"split",split:{...s,screen}} : null;
}
export async function detectVideoLayout(input:string, dir:string, duration:number) {
  // Snap sample times to the 5 fps grid so each still is also frame 0 of its motion burst.
  const times=[...new Set(layoutSampleTimes(duration).map(t=>Math.round(t*FRAME_GRID_FPS)/FRAME_GRID_FPS))];
  const count=times.length;
  const burstTimes=times.flatMap(t=>[t,t+1/FRAME_GRID_FPS,t+2/FRAME_GRID_FPS]);
  const stills=await extractGridFrames(input,dir,burstTimes,duration);
  const layoutStills=times.map((_,i)=>stills[i*3]);
  const result=z.object({frames:z.array(z.object({mode:z.enum(["speaker","split"]),split:splitSchema})).length(count)}).parse(await inspect(await partsFromStills(times,layoutStills),
    `Return EXACTLY ${count} entries in frames, one per image, using normalized FULL SOURCE coordinates. Each entry has mode (speaker or split), split.speaker, split.screen, split.speakerHead and split.speakerShape (circle or rectangle). Identify the live presenter region, not identity. mode speaker means the camera footage of the presenter fills most of the frame (greetings, endings); mode split means a screen recording/product UI is the main content, usually with a small webcam. speaker MUST enclose the ENTIRE available camera panel, hair, shoulders and chest, NOT a face crop, and MUST contain the presenter's face. speakerHead encloses ALL hair/top of head, face and chin, with a small safety margin; exclude hands from head bounds. Explicitly distinguish rectangular camera footage from an embedded circular webcam; do not guess circle merely because a panel is square. Never invent missing footage. For split scenes, screen must target ONLY the main demonstrated application/white product UI. EXCLUDE surrounding Slack messages, Slack navigation, chat threads, browser/devtools panels, desktop borders, and every presenter/webcam overlay. If Slack contains a screenshot or shared application, select that inner application, NOT the surrounding Slack window. Do not select a white rectangle just because it is white: it must be the demonstrated product. Prefer the largest useful application rectangle that excludes the small webcam; cropping some peripheral UI is preferable to showing a duplicate presenter. Output fills 30% screen and 70% presenter; framing uses head bounds to preserve hair and headroom. Do not confuse app avatars with the presenter. No prose.`));
  // Small webcam overlays: the model box is approximate (seen shifted onto the UI).
  // Snap it to where the presenter actually moves in the pixels.
  if(result.frames.some(f=>area(f.split.speaker)<0.2)) {
    const meta=await sharp(layoutStills[0]).metadata().catch(()=>null);
    const motion=meta?.width && meta.height ? await presenterMotionFromStills(times.map((_,i)=>stills.slice(i*3,i*3+3)),meta.width,meta.height).catch(()=>null) : null;
    if(motion?.samples) for(const f of result.frames) {
      if(area(f.split.speaker)>=0.2) continue;
      const snapped=snapSpeakerToMotion(f.split.speaker,motion);
      if(snapped) { f.split.speaker=snapped.speaker; f.split.speakerHead=snapped.head; }
    }
  }
  // Drop frames whose bounds cannot show Shaun; neighbours cover their time.
  const valid=result.frames.map((f,i)=>({time:times[i],frame:sanitizeLayoutFrame(f)})).filter((v):v is {time:number;frame:DetectedFrame}=>v.frame!==null);
  if(!valid.length) throw new SessionError(422,"The screen and camera could not be separated. Select their bounds manually.");
  const boundaries=[0,...valid.slice(1).map((v,i)=>(v.time+valid[i].time)/2),duration];
  const scenes: Array<{start:number;end:number;mode:"speaker"|"split";split:z.infer<typeof splitSchema>}>=[];
  valid.forEach(({frame:f},i)=>{
    const previous=scenes.at(-1);
    const sameHead=previous?.split.speakerHead && f.split.speakerHead &&
      (["x","y","width","height"] as const).every(key =>
        Math.abs(previous.split.speakerHead![key]-f.split.speakerHead![key]) <
          0.05 * (key==="x" || key==="width" ? f.split.speaker.width : f.split.speaker.height));
    const similar=previous && previous.mode===f.mode && sameHead &&
      previous.split.speakerShape===f.split.speakerShape && (["screen","speaker"] as const).every(panel=>
        (["x","y","width","height"] as const).every(key=>Math.abs(previous.split[panel][key]-f.split[panel][key])<0.04));
    if(similar) previous.end=boundaries[i+1];
    else scenes.push({start:boundaries[i],end:boundaries[i+1],...f});
  });
  return {split:scenes.find(s=>s.mode==="split")?.split ?? scenes[0].split,scenes:greetingScenes(scenes,duration),
    note:`Sampled ${count} frames (dense at the start and end) for the camera, full head and main product UI. Full-screen greeting and closing follow the detected camera-only footage; when none is detected they default to the first 6 and last 4 seconds. Framing protects headroom but is not continuous head tracking. Review crops and boundaries.`};
}
export const privacyRequestSchema=z.object({start:z.number().min(0),end:z.number().max(600),target:z.enum(["screen","speaker"]),crop:cropBoxSchema}).strict().refine(v=>v.end>v.start);
export async function detectPrivateDetails(input:string,dir:string,request:z.infer<typeof privacyRequestSchema>) {
  const count=Math.min(8,Math.max(1,Math.ceil((request.end-request.start)/2)));
  const step=(request.end-request.start)/count;
  const times=Array.from({length:count},(_,i)=>request.start+step*(i+0.5));
  // Text lines may be much smaller than a camera crop. Validate them separately,
  // then add safety padding before using the export blur minimum.
  const textBox=z.object({x:z.number().min(0).max(1),y:z.number().min(0).max(1),
    width:z.number().positive().max(1),height:z.number().positive().max(1)});
  const schema=z.object({frames:z.array(z.object({boxes:z.array(textBox).max(8)})).length(count)});
  const result=schema.parse(await inspect(await frames(input,dir,times),
    `Find visible personal/private details ONLY INSIDE this selected ${request.target} crop in full-source normalized coordinates: ${JSON.stringify(request.crop)}. Detect email addresses, personal phone numbers, addresses, payment/account identifiers, passwords/tokens, private customer names/contact lists. Return {"frames":[{"boxes":[{"x":0,"y":0,"width":0.1,"height":0.1}]}]} EXACTLY ${count} entries in image order. Boxes normalized to FULL image, tight padded rectangles around details. Do not return/read out private text. No faces or public software labels. Empty boxes if none visible.`,true));
  const c=request.crop;
  const blurs=result.frames.flatMap((f,i)=>f.boxes.flatMap(b=>{
    const x=Math.max(c.x,b.x-0.005),y=Math.max(c.y,b.y-0.005);
    const right=Math.min(c.x+c.width,b.x+b.width+0.005),bottom=Math.min(c.y+c.height,b.y+b.height+0.005);
    return right-x>=0.01 && bottom-y>=0.01 ? [{x,y,width:right-x,height:bottom-y,start:request.start+i*step,end:request.start+(i+1)*step}] : [];
  }));
  if(blurs.length>64) throw new SessionError(422,"Too many details found. Scan a shorter time range.");
  return {blurs,sampledFrames:count,note:"Review every suggested region and time range before exporting. Sampled detection can miss details or movement between frames; it is not guaranteed anonymization."};
}
