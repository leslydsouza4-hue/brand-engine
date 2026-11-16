# Brand Engine — handover for Claude / Claude Code

Prepared: 17 November 2026, India time (16 November UTC).

**Purpose:** Continue work on the existing Brand Engine codebase. Do not rebuild the product from scratch. Preserve the approved workspace UI and existing user data.

## 1. Start here

Brand Engine is an existing creative-production application for the HighLevel marketing team. It contains branded graphic generators, image libraries, shared saved sessions, and a Shaun Comin’ Atcha thumbnail/video workspace.

The immediate priority is **reliable, fast video finishing and downloads**. The user has repeatedly experienced long waits, interrupted exports, import failures, and misleading progress. Treat reliability and turnaround time as requirements, not optional polish.

Read these before changing code:

- This handover.
- `replit.md` — broad project context; some older sections are stale.
- `.agents/memory/MEMORY.md` and relevant linked notes, especially `shaun-video-finishing.md`, `shared-session-boundaries.md`, and the image-export/font notes.
- The actual implementation of the feature being changed. Current code wins over old descriptions.

Do not assume this document, the conversation history, or the existing development environment proves the published application works.

## 2. Current status and important caveats

### Verified while preparing this handover

- The latest download/progress changes are present in the repository.
- Git had no uncommitted changes before this document was added.
- Published app metadata reports a successful Autoscale build at:
  **https://high-level-brand-engine.replit.app**
- That metadata is **not** an end-to-end health check and does not establish which historical fixes were successfully exercised in production.
- The managed development API workflow is currently **failed** with:
  `EADDRINUSE: address already in use 0.0.0.0:8080`.
- The managed development frontend reports port `24830` occupied and has fallen back to `24831`. Its configured preview port is still `24830`.
- These port conflicts were documented, not fixed, during this handover. Establish which processes own the configured ports before restarting or killing anything. Do not start additional duplicate servers.

### Historical verification, not rerun for this document

During the preceding video-fix work:

- API and frontend production builds succeeded.
- Targeted tests passed for finite progress, missed heartbeats, streaming downloads, cancellation, stalled transfers, scene transitions, captions, audio, and small privacy regions.
- Real supplied video clips exported successfully in local checks.
- The whole frontend typecheck still had unrelated pre-existing errors in other workspaces. Do not describe the repository as globally type-clean.
- A public landing-page screenshot confirmed the app shell loaded; it did not verify the signed-in video editor or production download flow.

## 3. Product and design requirements

### General

- Keep the existing HighLevel workspace visual language: dark surfaces, clear controls, consistent navigation and preview panels.
- Do not invent unrelated layouts or redesign approved screens during a bug fix.
- Keep secondary options collapsible. The user explicitly dislikes a crowded editing sidebar.
- Existing templates and bulk graphic generation are already part of the product. Do not propose rebuilding those as new features.
- Prefer complete working flows over visual placeholders.

### Shaun Comin’ Atcha

**Descript remains the source editor. This app is not a Descript replacement.**

The intended flow:

1. Import a public, download-enabled Descript share or upload its exported MP4/MOV.
2. Prepare a browser-playable preview.
3. Detect the screen and speaker regions.
4. Automatically transcribe and prepare captions.
5. Let the user adjust framing, scenes, cuts and privacy blur.
6. One **Download MP4** action creates/reuses the finished video and downloads it.

Preserve the existing Thumbnail mode as well.

### Approved vertical composition — do not regress

- Vertical output is 9:16.
- During demos, the top approximately **30%** is the screen recording; the lower **70%** is Shaun.
- Shaun must fill a rectangular presenter panel. Do not show the original small webcam circle fitted inside a large empty panel.
- Crop/auto-zoom the available webcam image to remove its circular boundary. Do not claim to reconstruct missing source detail.
- The upper screen panel fills both horizontal edges without side gaps or aspect-ratio stretching.
- Exclude the embedded small bottom-left webcam from the upper screen panel so Shaun does not appear twice. This takes priority over preserving every pixel of source UI.
- Greeting footage is briefly speaker-only, roughly the first **5–8 seconds**, then split view.
- The outro/thanks can return to speaker-only.
- These are timing/layout defaults unless a real detector proves otherwise; do not describe defaults as semantic speech recognition.
- Keep horizontal framing working; the user did not ask for it to be redesigned.
- Screen and speaker support independent scale and hand-drag positioning. The preview and exported framing must agree.

### Captions, privacy and downloads

- Automatic transcription is on by default; the main control is on/off.
- Never overwrite existing manually edited captions or imported subtitles automatically.
- Keep the established white caption style with cyan active-word highlighting.
- Use genuinely aligned word timestamps, not evenly spaced words presented as exact timings.
- Keep caption review available; uncertainty must be handled honestly.
- Blur selection belongs in separate **Screen** and **Speaker** selection surfaces, not directly on the live output preview.
- Support manual blur and reviewed automatic personal-detail suggestions.
- Automatic privacy detection samples footage and can miss details. Do not promise complete anonymization.
- Use a single **Download MP4** action, not separate Render / Render Again / Download buttons.
- Keep trim/cuts, caption review and export settings collapsible.
- Do not restore “Fetch latest from Descript.”
- Name output from the Descript video title plus the thumbnail-style date, not a generic “Descript import.mp4.”
- Keep the selected export resolution when optimizing speed. Faster encoding may produce larger files.

## 4. Technology and repository map

This is a **pnpm TypeScript monorepo**, not a single-package app.

- Node.js 24; TypeScript 5.9.
- Frontend: React 19, Vite 7, Tailwind 4 and existing UI components.
- Backend: Express 5, esbuild ESM production bundle.
- Database: PostgreSQL with Drizzle.
- Authentication: existing Clerk integration.
- File storage: private App Storage / Google Cloud Storage SDK integration.
- Media: full FFmpeg/ffprobe distribution, Sharp, local Whisper inference.
- Existing AI integrations include Replit-proxied providers. Do not assume their credentials or proxy URLs work outside the configured environment.

| Location | Responsibility |
| --- | --- |
| `artifacts/brand-engine/` | Main web application; preview path `/` |
| `artifacts/api-server/` | Backend; routed under `/api` |
| `artifacts/mockup-sandbox/` | Existing design/component preview sandbox, not the production app |
| `lib/db/` | Drizzle database connection/schema |
| `lib/api-spec/` | OpenAPI specification/code generation |
| `lib/api-client-react/`, `lib/api-zod/` | Generated API client/schema packages |
| `lib/integrations-*/` | Existing AI integration packages |
| `docs/` | Existing session contracts and this handover |
| `attached_assets/` | Supplied reference images/videos and other source assets; verify availability in any clone |

Main UI entry for workspace selection:
`artifacts/brand-engine/src/pages/BrandEngine.tsx`.

The app includes HighLevel, LevelUp 26 and Summer of AI brand experiences. Existing builders include Content Army, Did You Know, Masterclass, Super Promo, email templates and many others. Do not limit an application-wide change to the Shaun editor accidentally.

### Shaun code map

Frontend paths below are relative to `artifacts/brand-engine/src/components/brand/`:

| File | Responsibility |
| --- | --- |
| `ShaunWorkspace.tsx` | Thumbnail/video workspace integration |
| `ShaunVideoEditor.tsx` | Video orchestration, session state, automation, download flow |
| `shaunVideo/VideoStage.tsx` | Canvas/video preview and dragging |
| `shaunVideo/edits.ts` | Edit model, framing calculations, validation/defaults |
| `shaunVideo/ScenesPanel.tsx`, `SplitPanels.tsx` | Scene and panel controls |
| `shaunVideo/PrivacyEditor.tsx` | Separate privacy selection workflow |
| `shaunVideo/CaptionEditor.tsx` | Caption editing |
| `shaunVideo/api.ts`, `downloadBody.ts` | Authenticated API calls, polling and download streaming |
| `shaunVideo/downloadName.ts` | Output filename rules |
| `shaun-video-api-contract.md` | Existing endpoint documentation; compare with actual routes |

Backend paths below are relative to `artifacts/api-server/src/`:

| File | Responsibility |
| --- | --- |
| `routes/shaun-video.ts` | Imports/uploads, jobs, preview, layout, transcription, rendering and assets |
| `lib/shaun-video-render.ts` | FFmpeg filters, captions, framing, media probing and runtime checks |
| `lib/shaun-job-progress.ts` | Finite progress parsing/normalization and heartbeat expiry |
| `lib/shaun-video-store.ts` | Private media/job metadata and source records |
| `lib/shaun-video-cache.ts` | Local source cache |
| `lib/shaun-video-import.ts` | Restricted Descript URL discovery/import |
| `lib/shaun-video-layout.ts` | Screen/speaker and privacy analysis |
| `lib/shaun-screen-crop.ts` | Excludes embedded webcam from the UI crop |
| `lib/shaun-video-transcribe.ts` | ASR worker orchestration |
| `lib/shaun-video-asr-worker.mjs`, `shaun-caption-alignment.mjs` | Local Whisper and genuine timestamp alignment |
| `lib/shaun-storage-stream.ts` | Safe storage-to-HTTP streaming |
| `index.ts` | Startup, including video-tool checks |

## 5. Video architecture and known limitations

### Media and speech

- Originals stay private and unchanged.
- Current upload limits are 250 MiB, 10 minutes, maximum 4096 pixels per edge.
- Export limit is 500 MiB.
- A lightweight VP8/Opus WebM proxy is used for browser editing; exports use the original source.
- Some test browsers cannot decode valid H.264/AAC. Check codec support, authenticated range delivery and actual decoded media before declaring the file corrupt.
- Speech uses `Xenova/whisper-tiny.en`, quantized CPU inference through Transformers, with cross-attention alignment.
- First use may download public model files into a temporary cache. Cold start differs from warm performance.
- The production build copies the ASR/alignment worker files; preserve that step.
- A transcription failure can occur during source audio preparation, before recognition. Do not blame the speaker’s English without evidence.

### Job execution — important unfinished reliability work

Jobs persist their status in private storage, but the actual processing task runs inside the API process.

**Durable status is not durable execution.** API process termination can kill an export and leave a stored `running` record behind.

Current improvements detect a stale heartbeat after approximately three minutes and give a retryable failure. They **do not** make a running render survive a restart or provide a durable queue/resume worker.

Concurrency controls and local caches are per-process, not a proven distributed scheduler across Autoscale instances.

If implementing durable recovery later, consider persisted job inputs, atomic ownership/leases, idempotency, retries, output publication and cancellation. Do not silently replace infrastructure, switch deployment type, or introduce paid services without discussing the change.

## 6. Recent incident and fixes already in code

### What the investigation established

During the earlier published-download incident:

- The API processes terminated/restarted while a render was active.
- The render’s stored heartbeat stopped, while polling continued returning HTTP 200.
- Progress was stored as `null`; the UI displayed 0%.
- Process interruption was confirmed. **OOM, resource throttling and the reason for termination were not established.**
- A later observed retry had a fresh heartbeat while rendering. Do not conclude every slow export was necessarily dead, or that progress/error fixes alone prove acceptable encoding speed.

### Implemented changes to preserve

- FFmpeg can report `out_time_us=N/A` before encoding begins. Parsing now ignores nonfinite progress and the job layer guards against NaN becoming JSON null.
- Job phases identify loading, creating and saving MP4 stages.
- Stale-worker detection was shortened from twenty minutes to approximately three.
- Pending render identity is retained in editor session state, so stopping/retrying can watch the same active job instead of starting duplicates.
- Finished render references are retained before file transfer, allowing a failed transfer to retry without re-encoding.
- MP4 transfers report byte progress and detect stalled/empty/incomplete/oversized downloads.
- Small privacy regions clamp chroma blur radii to valid values; previously these could make FFmpeg fail.
- Time-limited blur filters skip blur computation outside their active intervals.
- Encoding presets favor turnaround time at the selected resolution.
- Full FFmpeg is declared in `.replit`, and API startup verifies ffprobe plus required filters.
- Audio preparation can recover from the prepared preview if extraction from the original fails.
- Storage stream cancellation defers destruction until the SDK’s internal pipeline is initialized. Preserve this: immediate destruction previously caused an uncaught storage-stream failure.

These changes were locally checked. **Their presence is not proof that the current production build contains all of them or that the live signed-in download journey is fixed.**

## 7. Shared saved sessions — access and retention

Product policy is intentionally shared:

- Ordinary graphic editing remains available without signing in.
- Saved sessions, history, mutations and private assets require authentication.
- Shared saved work is visible to **all signed-in accounts**, including outside email addresses, not only a selected team or invited email domain.
- Do not reintroduce team isolation without an explicit product decision.
- Saves are explicit, with recoverable versions; this is not simultaneous live co-editing.

Retention is frequently misunderstood:

- **Active sessions do not expire after thirty days.**
- Archiving starts a thirty-day retention window.
- Editing or repeated archiving does not extend it.
- Unarchiving clears the timer.
- Expired archived sessions are cleaned up on a subsequent successful library request, not by a guaranteed wall-clock background timer.
- Permanent deletion affects everyone and requires confirmation and revision checks.
- Asset access metadata can be revoked when no retained session/version references it. Physical orphaned storage bytes are not fully garbage-collected yet.

Relevant files:

- `docs/saved-sessions-contract.md`
- `docs/saved-sessions-client-api.md`
- `artifacts/brand-engine/src/components/brand/sessions/`
- `artifacts/api-server/src/routes/saved-sessions.ts`
- `lib/db/src/schema/saved-sessions.ts`

New editor fields must participate in durable session state, portable image storage and stale-async-write protection. Test cross-user reopening when changing session behavior.

## 8. LevelUp 26 and other earlier requests

The user wanted navigation/workspaces based on existing Figma pages: speaker graphics, emails, social posts, community posts and social covers, plus a brand directory containing photos, backgrounds, logos and 3D icons.

Original reference:
`https://www.figma.com/design/lh8Atn9ffaALXKgfwj5nUQ/LEVELUP-BRANDING-2026`

Supplied node IDs:
`5401-91`, `6873-63`, `5001-65571`, `5001-65816`, `6015-12`, `5001-64715`, `5178-300`.

Existing implementation includes `LevelUpFigmaWorkspace.tsx`, `levelUpFigmaLayouts.tsx`, `LevelUpBrandDirectoryWorkspace.tsx`, `LevelUpImageLibraryWorkspace.tsx`, `LevelUpComposerWorkspace.tsx` and `public/levelup26/assets.json`.

**Do not claim a complete, exact Figma import.** Asset/page coverage has not been independently audited for this handover.

The user explicitly requires the exact **Monument** font. The current LevelUp workspace warns that the licensed Monument Extended font and verified source specifications were not supplied; fallback fonts are being used. Exact font fidelity remains unresolved, not complete.

Do not assume live Figma access is available. Obtain authorized access or source exports when needed, honor font licensing, and verify backgrounds/logos/icons against source references rather than inventing replacements.

Earlier ideas discussed but not verified as complete:

- ClickUp task links populating briefs for workshops, Super Promo, Masterclass, Did You Know and Content Army.
- Pre-export mistake checks.
- Straightening the green “DID YOU KNOW” thumbnail badge while preserving the rest of the design.

These are historical context, not authorization to implement them as part of a video fix.

## 9. Running, building and checking

Use **pnpm**, not npm/yarn. Do not replace the workspace structure.

### In Replit

Managed workflows already exist:

- `artifacts/brand-engine: web`
- `artifacts/api-server: API Server`
- `artifacts/mockup-sandbox: Component Preview Server`

Restart the existing workflow rather than creating a duplicate server. The current port conflicts must be diagnosed first.

Deployment/routing definitions:

- `artifacts/brand-engine/.replit-artifact/artifact.toml`
- `artifacts/api-server/.replit-artifact/artifact.toml`

The frontend is served at `/`; API traffic is routed under `/api`; startup health path is `/api/healthz`. Do not hardcode localhost into browser API URLs or bypass artifact base paths. When using Replit Agent tooling, follow the artifact schema-validation workflow for manifest changes.

### Useful verification commands

Run from the repository root:

```bash
# Backend production bundle
pnpm --filter @workspace/api-server run build

# Frontend production build outside the managed workflow's injected environment
PORT=24830 BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/brand-engine run build

# Fast backend regression checks
pnpm --filter @workspace/api-server exec tsx --test \
  src/tests/shaun-job-progress.test.ts \
  src/tests/shaun-video-runtime.test.ts \
  src/tests/shaun-storage-stream.test.ts \
  src/tests/shaun-descript-title.test.ts

# Real FFmpeg/render tests; require FFmpeg and supplied reference media
pnpm --filter @workspace/api-server exec tsx --test \
  src/tests/shaun-video-render.test.ts

# Frontend helpers, using the existing tsx executor
pnpm --filter @workspace/api-server exec tsx --test \
  ../brand-engine/src/components/brand/shaunVideo/downloadBody.test.ts \
  ../brand-engine/src/components/brand/shaunVideo/downloadName.test.ts \
  ../brand-engine/src/components/brand/shaunVideo/edits.test.ts

# Broad check — historical unrelated errors exist
pnpm run typecheck
```

For a non-Replit development environment, inspect the Vite proxy configuration, provide appropriate environment values and ensure both services use free ports. Replit-managed storage/auth/AI integrations are not automatically portable with a Git clone.

Do not run schema pushes against production. Do not reset or replace the existing database to make local setup easier.

## 10. Security, data and portability

- Keep existing Clerk authentication and authorization checks intact.
- Do not make private media public to solve a download problem.
- Preserve Descript download-owner settings and URL/DNS restrictions. Extensionless URLs can be valid; do not loosen host/protocol validation indiscriminately.
- Never log signed URLs, cookies, auth tickets, credentials, connection strings or secret values.
- Use the existing secure secret/environment configuration. Relevant names include `CLERK_*`, `VITE_CLERK_PUBLISHABLE_KEY`, `AI_INTEGRATIONS_*` and object-storage configuration names. This document intentionally contains no values.
- Changing coding assistants does not transfer the database, uploads, user accounts, integrations or secrets. Keep the hosting environment intact unless an explicit migration is requested.
- Keep large generated exports/model files out of Git. Use private durable storage for application assets; temporary files and caches are not durable storage.
- Read the memory notes on self-hosted font embedding, image decoding before PNG export, and preview iframe scheduling before changing image export behavior.

## 11. Recommended first work session

1. Read this document and inspect current code/diffs.
2. Identify the development processes occupying ports 8080 and 24830. Restore the existing managed workflows without duplicate listeners or unrelated refactors.
3. Establish which video fixes are actually present in the published build. Obtain approval before publishing.
4. Reproduce the full authenticated journey with a real Descript clip: import → playable preview → captions/layout → Download MP4.
5. Measure cold/warm source retrieval, encoding, storage upload and browser transfer separately. A valid progress bar does not prove speed.
6. Verify the downloaded MP4: dimensions, duration, audio sync, captions, scene transitions, privacy blur, filename and repeat-download reuse.
7. If process interruption remains a problem, propose durable execution/recovery explicitly. Do not label the current heartbeat/retry mechanism as durable rendering.
8. Preserve the approved framing and UI while fixing the verified bottleneck.

### Acceptance criteria

- No silent twenty-minute wait at 0%.
- A failed/interrupted job is clearly reported and can be retried without losing edits.
- Stop/retry does not start duplicate active exports for unchanged edits.
- A finished export is reused for transfer retries.
- The MP4 actually saves and plays, rather than merely returning a successful job-status response.
- Selected dimensions and approved screen/speaker framing are preserved.
- Manual edits and shared sessions remain intact.
- Actual measured performance and remaining limitations are reported honestly.

## 12. Starter message to paste into Claude Code

> Continue development of the existing Brand Engine application. First read docs/CLAUDE_HANDOVER.md, replit.md, and the relevant .agents/memory notes, then inspect the current implementation. Do not rebuild the app or redesign its approved UI. The immediate priority is reliable, fast Shaun Comin’ Atcha video exports and downloads. Diagnose the current development port conflicts, distinguish code already present from fixes actually verified in production, and identify the remaining bottleneck before changing architecture. Preserve authentication, shared-session access/retention, private media, caption timing, and the approved 30% screen / 70% rectangular-speaker composition. Report what you verified and what remains unverified. Ask before production publishing, database changes, infrastructure changes, or destructive operations.
