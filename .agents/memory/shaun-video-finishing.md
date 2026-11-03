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

Vertical output must be screen recording in the top half and Shaun cropped into the bottom half, with captions over his section. Leave horizontal framing alone.

**Why:** The user explicitly rejected fitting the whole horizontal recording into a vertical frame and requested the split-screen arrangement.

**How to apply:** Keep preview and export crops identical; detect presenter panels, not identity. Circular webcam overlays can overlap the screen crop. Do not claim continuous tracking from sparse frame checks or recoverable detail from small embedded camera footage.

Prefer direct hand-drag positioning over X/Y fields for screen and speaker. Keep technical caption/model details out of the primary editing flow.

**Why:** The user explicitly requested a hand instead of coordinates and objected to being asked to manually recover many omitted caption words.

**How to apply:** Keep advanced coordinates secondary; retain recognized text when word alignment fails by grouping existing aligned cues, and label uncertainty honestly rather than dropping words or inventing individual timestamps.
