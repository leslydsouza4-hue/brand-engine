# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### Brand Engine (`artifacts/brand-engine`)
- **Type**: React + Vite web app
- **Route**: `/`
- **Description**: Multi-brand creative tool. Sidebar pill toggles between HighLevel mode (default) and LevelUp 26 mode (`brandModeStore.ts`, persisted to localStorage). Each mode shows its own workspace list; switching modes auto-bounces the user to a sensible default workspace and changes the app background.
- **LevelUp 26 mode**:
  - **Image Library** (`LevelUpImageLibraryWorkspace.tsx`): Ingests public Google Drive folders via `/api/levelup/drive/list` (embeddedfolderview scrape) and proxies thumbnails through `/api/levelup/drive/image`. Auto-tags each image with Gemini 2.5 Flash vision (`/api/levelup/vision/tag`) in batches of 3, returning `{people, scene, mood, colors, objects, peopleCount}`. Manual edit modal for retag/delete. Smart NL search via `/api/levelup/vision/parse-query` + tag-scored `searchLibrary` in `levelUpStore.ts` (people-count match boosts heavily). Library persists in localStorage.
  - **Social Composer** (`LevelUpComposerWorkspace.tsx`): Brief input (headline/subtext/vibe/desired people count) → `pickTemplateForBrief` selects from 15 LU26 templates (`levelUpTemplates.tsx`: hero-photo-overlay, split-photo-text, duo-portrait, trio-grid, quote-card, stat-card, etc.) → matches photos from library by tag overlap → renders 4 social sizes (Square/Portrait/Story/Landscape) using `LevelUpCanvas` + `chromeScale` factor. Individual PNG and ZIP export via `html-to-image` `toPng({skipFonts:true})` + JSZip.
  - **Brand kit**: Placeholder SVG logos in `public/assets/levelup26/`. Real palette/fonts to be supplied later.
- **HighLevel mode workspaces**:
  - **Brand Brain**: Claude Opus 4.7-powered chat assistant. Users paste brand notes / Google Doc content, ask anything, and request designs. When the assistant produces a `<design_brief>` block, the UI renders a "Send to Craft Magic" button that hands the prompt off to the Craft Magic workspace (auto-switches tab + pre-fills prompt).
  - **Templates (Craft Magic)**: Category-based template picker (Social/Ads/Presentation/Email) with live preview. Accepts `seedPrompt` prop to receive prompts handed off from Brand Brain. **Size Pack** (Social format only, single-frame): one prompt → 4 social-media sizes (Square 1080×1080, Portrait 1080×1350, Story 1080×1920, Landscape 1200×628), each rendered through the best-fit deterministic template per orientation, downloaded together as one ZIP. **Email format** uses tiny canvases (600×200 header, 600×300 banner, 600×400 hero, 600×600 square); the deterministic templates (`craft-templates.ts`) auto-scale all chrome (orbs, pills, CTA, footnote, brand-tag, stat-label, logo, card padding/radius/font, message bubbles, stat values) via a `chromeScale(dims) = clamp(minDim/1080, 0.35, 1.0)` factor, with per-element minPx floors to keep small canvases readable.
  - **Shaun Thumbnails**: YouTube thumbnail creator with Shaun Clark poses, positioning, headline/subtext
  - **Zoom Backgrounds**: Virtual background generator with AI background removal, 8 gradient styles, photo upload
  - **Biz Dev Templates (Virtual Workshop)**: Campaign pack generator — input headline, date, guest name, CTA, person photo (auto bg removal); generates 6 fixed template variants (QL 1080×1080, Portrait 1080×1350, Horizontal CTA/Dates/Day1/Day2 1920×1080); gallery output with individual + bulk download
  - **Super Promo**: Host + Guest campaign pack — input headline, date, CTA, host/guest names+titles+photos; multi-size (Horizontal 1920×1080, Vertical 1080×1920, Portrait 1080×1350, Square 1080×1080); variants (Dates/CTA/No Date/Day 1/Day 2/Replays); individual + ZIP export
  - **Super Promo 2**: Guest-only campaign pack (no Host) — same sizes/variants as Super Promo but with single centered speaker circle; separate background (`assets/superpromo2/`); individual + ZIP export
  - **Master Class**: 12-template campaign pack (Horizontal/Square/Portrait/Story × Dates/No-Dates/Replay) with headline, date pill, guest name+role, person photo (auto bg removal). Individual PNG + bulk ZIP export. The "Preview & Download All" gallery has a per-template checkbox (default all selected) plus Select all / Select none controls; the bulk ZIP only includes the templates checked at click time. Notes: (1) `triggerDownload` uses a programmatic `<a download>` link, (2) `stripRadii` only flattens the outer template root so date pill / Replay pill / image rounding survives in PNGs, (3) person photo is stored as a data URL (not a blob URL) so html-to-image's CORS-anonymous fetch path doesn't fall through to the page root and abort exports, (4) `toPng` is called with `skipFonts: true` to avoid Google Fonts CORS failures, (5) the CTA variant was removed entirely — Replay (flat #FFD24A pill, dark navy circular replay-arrow icon, bold uppercase "Replay") is the third variant alongside Dates and No-Dates.
  - **Affiliate / Leader Board** (`LeaderBoardWorkspace.tsx`): Editable affiliate ranking — title, period (Week/Month/Quarter/All Time), metric (Commission/Signups/Active/MRR), per-row name/handle/metric/avatar (data URL). Renders 1080×1350 portrait card: gold/silver/bronze podium for top 3 + glassmorphic rows 4-10. PNG export via shared `useExport` (`handleExport("png", el)`).
  - **Affiliate / Affiliate Blurb**: Placeholder "Coming soon" workspace, route `#affiliate-blurb`.
  - **Swoosh Background**: Single 1920×1080 composition for speaker promo. Layers (back→front): dark navy "space" radial-gradient bg → back swoosh asset (`public/assets/swoosh/swoosh-highly.png`, contains the cyan trail with the Highly robot baked in at the top-right tip) → uploaded human cutout (auto bg removal via `@imgly/background-removal`) → front-clipped copy of the same swoosh asset (clip-path `inset(52% 0% 0% 0%)`, adjustable opacity) so the trail appears to wrap around the person without covering the face. Controls: human upload, human X/Y/scale, swoosh X/Y/scale, front-swoosh opacity. No headline / subtext / CTA / variants — single PNG download only. Same export plumbing as Master Class (data-URL person, programmatic `<a download>`, `skipFonts:true`, `pixelRatio` upscale to 1920×1080).
- **Design system**: Deep navy (#060B16), brand teal (#00B2A9), electric blue (#2896FB), CTA yellow (#FFD000)
- **Fonts**: Inter + Poppins (Google Fonts)
- **AI Features**:
  - Background removal via `@imgly/background-removal` (npm package, runs client-side)
  - Claude Design (Custom Design) — Anthropic Claude generates the design markup; Nano Banana Pro (Gemini) is used for any inline image needs via `lib/integrations-gemini-ai`
  - The standalone "AI Image" generator workspace was removed in favor of Claude Design (covers all use cases)
- **CMYK Export**: Customer Journey PDF export uses server-side Sharp CMYK conversion → DeviceCMYK PDF (true print-ready CMYK color space)
- **API Proxy**: Vite dev server proxies `/api` to API server at `http://localhost:8080`
- **Assets**: Shaun images from GitHub raw URLs

### API Server (`artifacts/api-server`)
- **Type**: Express 5 API
- **Port**: 8080
- **Routes**:
  - `GET /api/healthz` — health check
  - `POST /api/openai/generate-image` — OpenAI gpt-image-1 generation (prompt, size, count); basic rate limiting (5s between requests)
  - `POST /api/gemini/generate-image` — Gemini image generation (prompt, aspectRatio, style); supports Nano Banana 2 and Pro models
  - `POST /api/descript/fetch-meta` — Fetch OG metadata (title, thumbnail as base64) from a Descript share URL; frontend opens crop modal for manual UI area selection
  - `POST /api/convert-cmyk` — Convert RGB PNG to CMYK PDF using Sharp (toColorspace cmyk → JPEG → pdf-lib embedJpg with DeviceCMYK); 40MB limit; 300 DPI print-ready
  - `POST /api/levelup/drive/list` — Scrape a public Google Drive folder via embeddedfolderview and return file ids/names
  - `GET  /api/levelup/drive/image?id=...&size=w800` — Stream a Drive image through Drive's thumbnail endpoint (CORS-safe proxy)
  - `POST /api/levelup/vision/tag` — Gemini 2.5 Flash JSON image tagging (people/scene/mood/colors/objects/peopleCount)
  - `POST /api/levelup/vision/parse-query` — Turn an NL search string into structured tag criteria for the library
- **Dependencies**: `@workspace/integrations-openai-ai-server` for OpenAI, `@workspace/integrations-gemini-ai` for Gemini

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/brand-engine run dev` — run Brand Engine locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
