import { ai } from "@workspace/integrations-gemini-ai";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { layoutFrame, splitSchema, cropBoxSchema } from "./shaun-video-render";
import { SessionError } from "./session-validation";
import { greetingScenes } from "./shaun-greeting-scenes";
import { excludeWebcam } from "./shaun-screen-crop";

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
export async function detectVideoLayout(input:string, dir:string, duration:number) {
  const count=Math.min(8,Math.max(3,Math.ceil(duration/3)));
  const times=Array.from({length:count},(_,i)=>Math.max(0,Math.min(duration-0.25,i*duration/(count-1)+0.01)));
  const boundaries=[0,...times.slice(1).map((time,i)=>(time+times[i])/2),duration];
  const result=z.object({frames:z.array(z.object({mode:z.enum(["speaker","split"]),split:splitSchema})).length(count)}).parse(await inspect(await frames(input,dir,times),
    `Return EXACTLY ${count} entries in frames, one per image, using normalized FULL SOURCE coordinates. Each entry has mode (speaker or split), split.speaker, split.screen, split.speakerHead and split.speakerShape (circle or rectangle). Identify the live presenter region, not identity. Speaker-only greetings/endings use mode speaker. speaker MUST enclose the ENTIRE available camera panel, hair, shoulders and chest, NOT a face crop. speakerHead encloses ALL hair/top of head, face and chin, with a small safety margin; exclude hands from head bounds. Explicitly distinguish rectangular camera footage from an embedded circular webcam; do not guess circle merely because a panel is square. Never invent missing footage. For split scenes, screen must target ONLY the main demonstrated application/white product UI. EXCLUDE surrounding Slack messages, Slack navigation, chat threads, browser/devtools panels, desktop borders, and every presenter/webcam overlay. If Slack contains a screenshot or shared application, select that inner application, NOT the surrounding Slack window. Do not select a white rectangle just because it is white: it must be the demonstrated product. Prefer the largest useful application rectangle that excludes the small webcam; cropping some peripheral UI is preferable to showing a duplicate presenter. Output fills 30% screen and 70% presenter; framing uses head bounds to preserve hair and headroom. Do not confuse app avatars with the presenter. No prose.`));
  const scenes: Array<{start:number;end:number;mode:"speaker"|"split";split:z.infer<typeof splitSchema>}>=[];
  result.frames.forEach((f,i)=>{
    if(f.mode==="split") {
      const clean=excludeWebcam(f.split.screen,f.split.speaker);
      if(!clean) throw new SessionError(422,"The screen and camera could not be separated. Select their bounds manually.");
      f.split.screen=clean;
    }
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
    note:`Sampled ${count} frames for the camera, full head and main product UI. Framing protects headroom but is not continuous head tracking. Full-screen greeting defaults to the first 6 seconds and closing to the last 4 seconds (shorter for short clips). These are editable timing defaults, not speech detection. Review crops and boundaries.`};
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
