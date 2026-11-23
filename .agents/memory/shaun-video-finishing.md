---
name: Shaun video finishing
description: Product boundaries and non-obvious transcription/import/testing constraints
---

Descript is not being replaced. The user wants to finish Descript-sourced footage in Brand Engine: burn captions in the supplied white/cyan highlighted style, edit cuts/blurs, produce vertical/horizontal output, and create thumbnails.

**Why:** The user explicitly corrected the scope: Descript remains their source and its originals may have no captions; attached captioned clips are style references, not proof the originals are captioned.

**How to apply:** Preserve the existing Thumbnail workflow and HighLevel workspace UI. Do not add a separate full video-production product or infer source captions from reference exports.

Use genuine aligned word timestamps, not evenly distributed transcript words.

**Why:** The available cloud mini-transcribe model returned text without precise timing; the proxy rejected whisper-1. Local Whisper cross-attention alignment worked on real source audio. One ONNX export lacked cross-attention outputs; the Xenova tiny English export supported alignment.

**How to apply:** Verify timing support before switching speech providers/models. Retain explicit uncertainty reporting and human caption review.

Public Descript download URLs can be extensionless and supplied in page metadata; a missing `.mp4` match is not evidence that the media is inaccessible.

Do not interpret a generic transcription-job failure as bad English audio: inspect its last phase. Audio retrieval/extraction can fail before Whisper runs even when the same source transcribes successfully.

**Why:** A failed production job stopped at audio preparation while the identical source produced aligned words locally.

**How to apply:** Separate preparation failures from recognition failures, retain stage diagnostics, and verify recovery using the same source.

Persisted “running” job metadata is not evidence that its worker is alive. An API-process restart kills its in-process video task even while status polling continues to return HTTP 200.

**Why:** A published export remained waiting after a confirmed process termination; its stored heartbeat had stopped. Telemetry did not prove OOM or resource throttling.

**How to apply:** Use heartbeat freshness to detect interrupted work and preserve the pending job identity when stopping/retrying. Surviving restarts requires durable execution or recovery, not just durable status records. Do not claim a faster render when only a stranded wait was fixed.

FFmpeg can emit `out_time_us=N/A` before the first encoded frame. Nonfinite progress must never reach persistence: NaN becomes JSON null and can permanently poison monotonic progress updates.

**Why:** A real published export stored null progress and displayed 0% throughout.

**How to apply:** Validate finite numbers both when parsing media-tool output and at the job-progress boundary.

Development can expose FFmpeg through an injected runtime path even when it is not declared as a production dependency. A successful local render is not evidence that the published runtime has the tools.

**Why:** Import and audio-preparation failures appeared after publishing; FFmpeg worked locally but was absent from the declared system dependencies. Historical job logs hid the exception, so that incident's exact cause could not be proven.

**How to apply:** Explicitly declare the full FFmpeg package and verify ffprobe plus caption/blur filters before the server reports healthy. Keep safe background-job failure diagnostics.

A Descript import 502 can occur before Descript is contacted: a startup video-tool verification timeout has left the entire development API stopped.

**Why:** The failed workflow showed `ffprobe -version` exceeding its startup limit, rather than an import-handler failure.

**How to apply:** Inspect server startup first. Allow a bounded retry for transient startup tool timeouts, but do not report healthy when tools or required filters are genuinely missing.

GCS read streams emit `response` before constructing their internal pipeline. Destroying a stream immediately on an early browser disconnect can crash the server outside the stream error handler.

**Why:** Preview cancellation produced `ERR_STREAM_UNABLE_TO_PIPE` in the storage SDK.

**How to apply:** Allow response pipeline initialization before destroying a cancelled storage stream; test cancellation before the upstream response arrives.

**Why:** Both supplied shares imported successfully only after reading their public metadata's original-media URL. Owner download settings must be honored.

**How to apply:** Inspect accessible public metadata before reporting a blocked import; retain narrow host/path validation and public-DNS pinning through redirects.

Headless browser playback failures may reflect missing H.264/AAC support rather than broken media delivery.

**Why:** Browser `canPlayType` returned empty for H.264/AAC and the decoder reported no supported streams, while source bytes matched and MP4 output/audio/rendered effects verified successfully.

**How to apply:** Check decoder capabilities, media errors, authenticated ranges, and real decoded output before weakening headers or rewriting valid media.

Do not treat validated MP4 exports as proof that in-editor playback works. Use a separate browser-friendly editing proxy, preserving original bytes and source-time coordinates.

**Why:** The user encountered a blank preview with an imported 4K Descript video after the export-only verification had passed.

**How to apply:** Verify decoded playback and seeking, not merely successful renders; keep conversion automatic for existing saved sessions as well as new imports.

Prioritize fast editing previews over preview resolution; retain full-quality originals for final output.

**Why:** The user explicitly said processing must be faster than doing the work in an editor. A high-resolution editing proxy adds delay without improving final output.

**How to apply:** Benchmark changes on the same input, distinguish conversion from total import time, and reuse existing cached previews rather than regenerating them for quality-setting changes.

Keep the user's selected export resolution when optimizing speed; prefer faster encoding over maximum compression, accepting potentially larger MP4 files.

**Why:** The user repeatedly prioritizes turnaround time. Silently lowering the selected resolution would change the output they requested.

**How to apply:** Skip privacy-filter computation outside active regions' time ranges and verify real output dimensions, audio, captions and blur after encoding changes.

Vertical demos use approximately 30% screen above 70% Shaun, matching the supplied reference. Shaun must automatically fill a rectangular presenter panel—not show the whole small camera circle fitted inside it. Enlarge the available camera image into the panel; do not ask the user to repeatedly zoom. Speaker-only greetings and thanks/outros fill the portrait frame. Leave horizontal framing alone.

Exclude the small embedded bottom-left Shaun webcam from the upper UI panel, even if a portion of the screen must be cropped. Shaun should appear only in the large lower presenter section during demos.

The upper screen panel should fill edge-to-edge without side gaps, preserving aspect ratio by cropping overflow rather than stretching.

**Why:** The user explicitly rejected the empty left/right margins in the screen panel.

Frame Shaun with his full hair/top of head and reasonable headroom, not a centred face zoom. The screen panel should show the demonstrated product UI, excluding surrounding Slack, chat threads and developer panels as well as the small duplicate webcam. Caption highlights should have slightly rounded corners in exported video, not only in the preview.

**Why:** The user approved the overall video look but corrected clipped-head framing, square exported highlights and retained Slack chrome. This supersedes the earlier request to retain Slack UI.

**How to apply:** Use available camera footage and detected head bounds without claiming to recover missing source pixels or continuous tracking. Preserve manual adjustments; invalidate cached layout/output references when these rendering rules change.

Only Shaun and his actual camera background belong in the presenter panel; curved camera-mask edges and material outside the camera must not appear, including after headroom adjustments or dragging.

**Why:** The user repeated the no-camera-circle requirement after a headroom correction revealed the original curved edge at the top-right.

**How to apply:** Circular camera crops need corner-in-ellipse safety, not just rectangular crop bounds. Do not enforce that by pinning drag movement: the user reported that protection made the speaker impossible to move. Expand the effective crop zoom as needed for manual movement, explain the zoom behavior, and keep preview/export identical.

The user approved the filled rectangular Shaun framing and edge-to-edge UI panel. Preserve it. The preferred workflow is one Download action, not separate render/download steps; secondary editing controls should stay collapsed to keep the sidebar clean. Video filenames should use the Descript title plus the thumbnail-style date.

**Why:** The user explicitly confirmed the visuals looked good and asked to simplify the finishing workflow rather than redesign the framing again.

**Why:** The user repeated this correction after asking to preserve the screen UI; webcam exclusion takes priority over retaining all source UI.

**Why:** The user explicitly corrected the contain-fit interpretation and supplied a zoomed rectangular reference. Cropping inside the camera circle removes its visible border without inventing missing footage.

The full-screen greeting should be brief—roughly the first 5–8 seconds (“Happy Thursday”, “good morning”)—then the demo switches to split view, with full-screen Shaun again for the outro.

**Why:** The user clarified that greetings must not leave Shaun full-screen deep into the demonstration. Timing defaults must not be described as recognizing speech.

**How to apply:** Keep preview and export crops identical; detect presenter panels, not identity. Circular webcam overlays can overlap the screen crop. Do not claim continuous tracking from sparse frame checks or recoverable detail from small embedded camera footage.

Prefer direct hand-drag positioning over X/Y fields for screen and speaker. Keep technical caption/model details out of the primary editing flow.

**Why:** The user explicitly requested a hand instead of coordinates and objected to being asked to manually recover many omitted caption words.

**How to apply:** Keep advanced coordinates secondary; retain recognized text when word alignment fails by grouping existing aligned cues, and label uncertainty honestly rather than dropping words or inventing individual timestamps.

Transcription should happen automatically; the primary caption control is on/off, not a manual transcribe step.

**Why:** The user explicitly requested automatic transcription with only an on/off control. Never overwrite existing caption edits or imported subtitles automatically.

Keep the main video controls focused on the scene currently visible; hide base-layout and detailed scene timing controls under Advanced. Fit the screen content by default instead of permanently cutting off its edges.

**Why:** The user found the base-layout/expanded-scenes sidebar complicated and reported that scaling and dragging cut off the screen. Main sliders must visibly affect the current scene.

Blur selection belongs in separate Screen and Speaker selection surfaces, not on the live output preview. Support manual regions and reviewed automatic personal-detail suggestions.

**Why:** The user explicitly requested two selectors outside the live preview and both manual and automatic blur.

**How to apply:** Preserve source coordinates and time ranges through crops, scenes and cuts; explain sampled detection can miss details and require review before applying suggestions. Do not claim guaranteed anonymization.

Use a constrained response schema for vision coordinates, and avoid seeking to the last few milliseconds when extracting analysis stills.

**Why:** Unconstrained multi-image responses returned pixel coordinates despite normalized-coordinate prompts; seeking after the last decodable video frame produced no image even though FFmpeg exited successfully.

**How to apply:** Validate model bounds, keep final samples safely inside the duration, and use probed source duration rather than rounded display duration.
