import {test} from "node:test";
import assert from "node:assert/strict";
import {excludeWebcam} from "../lib/shaun-screen-crop";
test("lower-left webcam is excluded while retaining largest UI area",()=>{
 const r=excludeWebcam({x:0,y:0,width:1,height:1},{x:0.007,y:0.754,width:0.131,height:0.231})!;
 assert.ok(r.x>=0.138 && r.width>0.85);
 assert.equal(r.height,1);
});
test("separate screen unaffected; fully overlapping source needs manual selection",()=>{
 const screen={x:0.3,y:0,width:0.7,height:1};
 assert.deepEqual(excludeWebcam(screen,{x:0,y:0,width:0.2,height:1}),screen);
 assert.equal(excludeWebcam(screen,screen),null);
});
