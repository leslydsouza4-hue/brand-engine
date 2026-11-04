import {test} from "node:test";
import assert from "node:assert/strict";
import {greetingScenes} from "../lib/shaun-greeting-scenes";
test("greeting ends at six seconds and closing starts four seconds before end",()=>{
 const scenes=greetingScenes([{start:0,end:15,mode:"speaker" as const,split:"camera"},{start:15,end:73,mode:"split" as const,split:"demo"}],73);
 assert.deepEqual(scenes.map(s=>[s.start,s.end,s.mode]),[[0,6,"speaker"],[6,15,"split"],[15,69,"split"],[69,73,"speaker"]]);
 assert.equal(scenes[1].split,"demo");
});
test("short clips retain positive ordered scene intervals",()=>{
 const scenes=greetingScenes([{start:0,end:3,mode:"split" as const,split:{}}],3);
 assert.ok(scenes.every(s=>s.end>s.start));
 assert.equal(scenes[0].start,0);assert.equal(scenes.at(-1)?.end,3);
});
