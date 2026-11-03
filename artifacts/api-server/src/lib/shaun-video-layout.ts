import { ai } from "@workspace/integrations-gemini-ai";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { layoutFrame, splitSchema } from "./shaun-video-render";
import { SessionError } from "./session-validation";

export async function detectVideoLayout(input: string, dir: string, duration: number) {
  const times = [0.12, 0.5, 0.85].map(f => duration * f);
  const images = await Promise.all(times.map(async (time, i) => {
    const path = join(dir, `layout-${i}.jpg`);
    await layoutFrame(input, path, time);
    return { inlineData: { data: (await readFile(path)).toString("base64"), mimeType: "image/jpeg" } };
  }));
  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    config: { responseMimeType: "application/json", httpOptions: { timeout: 45000 } },
    contents: [{ role: "user", parts: [...images, { text: `These are chronological frames from one screen-recording video with a presenter camera panel. Locate the primary live human presenter camera region (NOT avatars inside software) and the shared computer screen content. Return JSON {"stable":true,"split":{"speaker":{"x":0,"y":0,"width":0.2,"height":0.3},"screen":{"x":0.2,"y":0,"width":0.8,"height":1}},"note":"brief explanation"}. Coordinates normalized 0..1 in full input image, precise panel bounds not face bounding box. Speaker region should include head and shoulders, exclude software. IMPORTANT: these are INDEPENDENT CROPS, not a partition. They CAN OVERLAP and need NOT cover the full frame. Picture-in-picture is expected and valid. For an overlaid webcam, crop the webcam tightly as speaker; screen can be the whole shared screen including the small embedded webcam when excluding it would remove essential screen content. Explain this in note. Prefer an unobstructed rectangular screen area when useful. Check ALL three frames: if the camera or screen moves significantly, disappears, cannot be identified reliably, or video is speaker-only, return {"stable":false,"note":"why manual crop selection is needed"} instead of guessing. No identity recognition is needed. This is for top-half screen and bottom-half speaker video composition.` }] }],
  });
  const result = z.object({ stable: z.boolean(), split: splitSchema.optional(), note: z.string().max(600) }).parse(JSON.parse(response.text || "{}"));
  if (!result.stable || !result.split) throw new SessionError(422, `Choose the speaker and screen crops manually. ${result.note}`);
  return { split: result.split, note: result.note };
}
