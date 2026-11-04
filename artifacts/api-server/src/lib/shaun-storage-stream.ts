import type { Readable, Writable } from "node:stream";

/** GCS builds its internal pipeline immediately AFTER emitting response.
 * Destroying during that setup can throw outside the stream error handler. */
export function pipeStorageResponse(stream: Readable, response: Writable) {
  let ready = false;
  stream.once("response", () => {
    setImmediate(() => {
      ready = true;
      if (response.destroyed) stream.destroy();
    });
  });
  response.once("close", () => {
    stream.unpipe(response);
    if (ready) stream.destroy();
    else stream.resume(); // Allow SDK initialization before cancelling its request.
  });
  stream.on("error", () => { if (!response.destroyed) response.destroy(); });
  stream.pipe(response);
}
