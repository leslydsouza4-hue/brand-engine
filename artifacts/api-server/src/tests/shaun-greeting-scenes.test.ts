import {test} from "node:test";
import assert from "node:assert/strict";
import {greetingScenes} from "../lib/shaun-greeting-scenes";
const spans=(s:{start:number;end:number;mode:string}[])=>s.map(x=>[x.start,x.end,x.mode]);
test("detected camera-only greeting and sign-off follow the source switch points",()=>{
 const scenes=greetingScenes([{start:0,end:8,mode:"speaker" as const,split:"camera"},{start:8,end:66,mode:"split" as const,split:"demo"},{start:66,end:73,mode:"speaker" as const,split:"camera"}],73);
 assert.deepEqual(spans(scenes),[[0,8,"speaker"],[8,66,"split"],[66,73,"speaker"]]);
 assert.equal(scenes[0].split,"camera"); assert.equal(scenes[2].split,"camera");
});
test("without detected camera-only footage, defaults to 6 s opening and 4 s closing on the same-time crop",()=>{
 const scenes=greetingScenes([{start:0,end:73,mode:"split" as const,split:"demo"}],73);
 assert.deepEqual(spans(scenes),[[0,6,"speaker"],[6,69,"split"],[69,73,"speaker"]]);
 assert.ok(scenes.every(s=>s.split==="demo"));
});
test("a long camera-only opening is capped at 40% of the video",()=>{
 const scenes=greetingScenes([{start:0,end:50,mode:"speaker" as const,split:"camera"},{start:50,end:100,mode:"split" as const,split:"demo"}],100);
 assert.equal(scenes[0].end,40); assert.equal(scenes[0].mode,"speaker");
 // Source is still camera-only after the cap: never crop it as a demo split.
 assert.equal(scenes[1].mode,"speaker"); assert.equal(scenes[1].split,"camera");
});
test("short clips retain positive ordered scene intervals",()=>{
 const scenes=greetingScenes([{start:0,end:3,mode:"split" as const,split:{}}],3);
 assert.ok(scenes.every(s=>s.end>s.start));
 assert.equal(scenes[0].start,0);assert.equal(scenes.at(-1)?.end,3);
});
