import app from "./app";
import { logger } from "./lib/logger";
import { verifyVideoRuntime } from "./lib/shaun-video-render";
import { warmTranscriber } from "./lib/shaun-video-transcribe";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

await verifyVideoRuntime({ onRetry: tool => logger.warn({ tool }, "Video runtime check timed out during startup; retrying within startup budget") });
logger.info("Video runtime verified: ffmpeg, ffprobe, caption and blur filters available");

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  // Load the caption model in the background so the first upload's captions start immediately.
  warmTranscriber();
});
