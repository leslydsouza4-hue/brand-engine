import {test} from "node:test";
import assert from "node:assert/strict";
import {layoutSampleTimes,sanitizeLayoutFrame} from "../lib/shaun-video-layout";
test("samples densely in the greeting and sign-off, never at t=0",()=>{
 const t=layoutSampleTimes(180);
 assert.ok(t[0]>=1); assert.ok(t.filter(x=>x<=12).length>=6); assert.ok(t.filter(x=>x>=172).length>=3);
 assert.ok(t.every(x=>x<=179.75)); assert.ok(t.length<=17);
 const short=layoutSampleTimes(10); assert.ok(short.length>=3 && short[0]>0 && short.at(-1)!<=9.75);
});
const full={x:0,y:0,width:1,height:1}, cam={x:0.02,y:0.72,width:0.14,height:0.25};
test("full-frame camera stays speaker",()=>{
 const f=sanitizeLayoutFrame({mode:"speaker",split:{speaker:full,screen:full,speakerHead:{x:0.35,y:0.1,width:0.3,height:0.45}}});
 assert.equal(f?.mode,"speaker");
});
test("speaker box that does not contain the head is rejected (would show UI)",()=>{
 assert.equal(sanitizeLayoutFrame({mode:"speaker",split:{speaker:{x:0.3,y:0,width:0.7,height:0.6},screen:full,speakerHead:cam}}),null);
});
test("small webcam labelled speaker becomes a split with the webcam excluded",()=>{
 const f=sanitizeLayoutFrame({mode:"speaker",split:{speaker:cam,screen:full,speakerHead:{x:0.05,y:0.75,width:0.08,height:0.12}}});
 assert.equal(f?.mode,"split"); assert.ok(f!.split.screen.y+f!.split.screen.height<=cam.y || f!.split.screen.x>=cam.x+cam.width);
});
