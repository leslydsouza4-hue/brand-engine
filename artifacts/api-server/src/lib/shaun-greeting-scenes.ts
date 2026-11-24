/**
 * Full-screen greeting/closing intervals. Prefer the detected camera-only runs at the
 * start/end of the video (Descript: "hey, good morning" → screen demo → sign-off).
 * Fall back to short editable timing defaults when no camera-only footage was detected.
 * This does not claim to recognize spoken words.
 */
export function greetingScenes<T extends {start:number;end:number;mode:"speaker"|"split";split:unknown}>(scenes:T[],duration:number,trimStart=0,trimEnd=duration):T[] {
  // Defaults count from the trimmed edges, so the greeting starts where Shaun appears.
  const kept=Math.max(0,trimEnd-trimStart);
  let opening=trimStart+Math.min(6,kept*0.3);
  let closing=trimEnd-Math.min(4,kept*0.2);
  const demo=scenes.find(s=>s.mode==="split");
  if(demo) {
    // Detected camera-only runs at either edge define the greeting; never past 40% / before 60%.
    if(scenes[0].mode==="speaker") opening=Math.min(demo.start,trimStart+kept*0.4);
    const lastDemo=[...scenes].reverse().find(s=>s.mode==="split")!;
    if(scenes[scenes.length-1].mode==="speaker") closing=Math.max(lastDemo.end,trimStart+kept*0.6);
  }
  closing=Math.max(closing,opening);
  return scenes.flatMap(scene=>{
    const edges=[scene.start,...[opening,closing].filter(t=>t>scene.start && t<scene.end),scene.end];
    return edges.slice(0,-1).map((start,i)=>{
      const greeting=start<opening || start>=closing;
      // Outside the greeting, never crop a camera-only frame as a demo split: keep it
      // full-screen unless the detection itself saw a split here.
      return {...scene,start,end:edges[i+1],mode:greeting?"speaker" as const:scene.mode};
    });
  }).filter(s=>s.end>s.start);
}
