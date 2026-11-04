/** Short, editable timing defaults. This does not claim to recognize spoken words. */
export function greetingScenes<T extends {start:number;end:number;mode:"speaker"|"split";split:unknown}>(scenes:T[],duration:number):T[] {
  const opening=Math.min(6,duration*0.3);
  const closing=duration-Math.min(4,duration*0.2);
  const demo=scenes.find(s=>s.mode==="split");
  return scenes.flatMap(scene=>{
    const edges=[scene.start,...[opening,closing].filter(t=>t>scene.start && t<scene.end),scene.end];
    return edges.slice(0,-1).map((start,i)=>{
      const greeting=start<opening || start>=closing;
      // In a demo, do not let coarse sampled opening scenes extend full-screen
      // Shaun into the feature section. Keep the detected demo's screen bounds.
      return {...scene,start,end:edges[i+1],mode:greeting?"speaker" as const:demo?"split" as const:scene.mode,
        split:!greeting && scene.mode==="speaker" && demo?demo.split:scene.split};
    });
  });
}
