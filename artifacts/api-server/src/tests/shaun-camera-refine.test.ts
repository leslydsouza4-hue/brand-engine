import {test} from "node:test";
import assert from "node:assert/strict";
import {snapSpeakerToMotion} from "../lib/shaun-camera-refine";
// Synthetic motion map: presenter moving in a bottom-left webcam (x .02-.12, y .78-.97).
const width=480,height=270,mask=new Uint8Array(width*height);
for(let y=Math.round(.78*height);y<Math.round(.97*height);y++) for(let x=Math.round(.02*width);x<Math.round(.12*width);x++) mask[y*width+x]=1;
const m={mask,width,height,samples:10};
test("a model camera box shifted up onto the UI snaps back onto the moving presenter",()=>{
 const r=snapSpeakerToMotion({x:0.01,y:0.5,width:0.13,height:0.22},m)!;
 assert.ok(r.speaker.y>0.7 && r.speaker.y+r.speaker.height<=1.0001, JSON.stringify(r));
 const cx=r.head.x+r.head.width/2, cy=r.head.y+r.head.height/2;
 assert.ok(cx>r.speaker.x && cx<r.speaker.x+r.speaker.width && cy>r.speaker.y && cy<r.speaker.y+r.speaker.height);
});
test("no motion near the box leaves it to the model",()=>{
 assert.equal(snapSpeakerToMotion({x:0.7,y:0.05,width:0.12,height:0.2},m),null);
});
