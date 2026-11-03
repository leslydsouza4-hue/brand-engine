import type { File } from "@google-cloud/storage";
import { ObjectStorageService, objectStorageClient } from "./objectStorage";
import { SessionError } from "./session-validation";

export const videoStorage = new ObjectStorageService();
export const MAX_VIDEO_BYTES = 250 * 1024 * 1024;
export const MAX_DURATION = 10 * 60;
export type VideoRecord = {
  videoId: string; name: string; owner: string; status: "uploading" | "ready";
  size: number; contentType: string; staging?: string; probe?: unknown; createdAt: string;
};
export type JobRecord = {
  jobId: string; owner: string; worker: string; kind: "import" | "render" | "frame" | "transcribe" | "preview";
  status: "queued" | "running" | "succeeded" | "failed"; progress: number;
  videoId?: string; error?: string; result?: unknown; contentType?: string; phase?: string;
  createdAt: string; updatedAt: string;
};
export function privateFile(_owner: string, key: string): File {
  const parts = videoStorage.getPrivateObjectDir().replace(/^\/|\/$/g, "").split("/");
  const bucket = parts.shift()!;
  // Same policy as saved sessions: the library is shared by all signed-in users.
  // This namespace is never public; every serving route still requires Clerk.
  return objectStorageClient.bucket(bucket).file([...parts, "shaun-video", "shared-library", key].join("/"));
}
export async function readRecord<T>(owner: string, key: string): Promise<T> {
  try {
    const [bytes] = await privateFile(owner, key).download();
    return JSON.parse(bytes.toString("utf8")) as T;
  } catch (error) {
    if ((error as { code?: number }).code === 404) throw new SessionError(404, "Video or job not found");
    throw error;
  }
}
export async function saveRecord(owner: string, key: string, value: unknown) {
  await privateFile(owner, key).save(JSON.stringify(value), {
    resumable: false, contentType: "application/json", metadata: { cacheControl: "private, no-store" },
  });
}
export async function getVideo(owner: string, id: string, ready = true) {
  const video = await readRecord<VideoRecord>(owner, `videos/${id}.json`);
  if (video.status === "uploading" && Date.now() - Date.parse(video.createdAt) > 3600000)
    throw new SessionError(410, "Pending upload expired. Start a new upload.");
  if (ready && video.status !== "ready") throw new SessionError(409, "Finish uploading this video first");
  return video;
}
export function videoResponse(video: VideoRecord) {
  return { videoId: video.videoId, name: video.name, status: video.status, probe: video.probe,
    createdAt: video.createdAt, assetUrl: `/api/shaun-video/videos/${video.videoId}/asset` };
}
