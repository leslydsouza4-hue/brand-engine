import {test} from "node:test";
import assert from "node:assert/strict";
import {deepgramWords} from "../lib/shaun-video-deepgram";
test("cloud words become chronological, non-overlapping, punctuated caption words",()=>{
 const w=deepgramWords([{word:"hey",punctuated_word:"Hey,",start:0.8,end:1.2},{word:"happy",start:1.1,end:1.5},{word:"",start:2,end:2.1},{word:"bad",start:NaN,end:1}],36);
 assert.deepEqual(w.map(x=>x.text),["Hey,","happy"]);
 assert.ok(w[1].start>=w[0].end);
});
