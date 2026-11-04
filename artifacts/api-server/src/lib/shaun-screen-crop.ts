type Rect={x:number;y:number;width:number;height:number};
/** Largest screen rectangle excluding the embedded webcam, with a small safety margin. */
export function excludeWebcam(screen:Rect,speaker:Rect):Rect|null {
  const right=screen.x+screen.width,bottom=screen.y+screen.height;
  if(speaker.x>=right || speaker.y>=bottom || speaker.x+speaker.width<=screen.x || speaker.y+speaker.height<=screen.y) return screen;
  const left=Math.max(screen.x,speaker.x-0.005),top=Math.max(screen.y,speaker.y-0.005);
  const camRight=Math.min(right,speaker.x+speaker.width+0.005),camBottom=Math.min(bottom,speaker.y+speaker.height+0.005);
  const choices=[
    {x:screen.x,y:screen.y,width:screen.width,height:top-screen.y},
    {x:camRight,y:screen.y,width:right-camRight,height:screen.height},
    {x:screen.x,y:camBottom,width:screen.width,height:bottom-camBottom},
    {x:screen.x,y:screen.y,width:left-screen.x,height:screen.height},
  ].filter(r=>r.width>=0.02 && r.height>=0.02);
  return choices.sort((a,b)=>b.width*b.height-a.width*a.height)[0]??null;
}
