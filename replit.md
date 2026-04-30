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
- **Description**: HighLevel-branded creative tool for generating marketing assets
- **Workspaces**:
  - **Brand Brain**: Claude Opus 4.7-powered chat assistant. Users paste brand notes / Google Doc content, ask anything, and request designs. When the assistant produces a `<design_brief>` block, the UI renders a "Send to Craft Magic" button that hands the prompt off to the Craft Magic workspace (auto-switches tab + pre-fills prompt).
  - **Templates (Craft Magic)**: Category-based template picker (Social/Ads/Presentation/Email) with live preview. Accepts `seedPrompt` prop to receive prompts handed off from Brand Brain. **Size Pack** (Social format only, single-frame): one prompt → 4 social-media sizes (Square 1080×1080, Portrait 1080×1350, Story 1080×1920, Landscape 1200×628), each rendered through the best-fit deterministic template per orientation, downloaded together as one ZIP. **Email format** uses tiny canvases (600×200 header, 600×300 banner, 600×400 hero, 600×600 square); the deterministic templates (`craft-templates.ts`) auto-scale all chrome (orbs, pills, CTA, footnote, brand-tag, stat-label, logo, card padding/radius/font, message bubbles, stat values) via a `chromeScale(dims) = clamp(minDim/1080, 0.35, 1.0)` factor, with per-element minPx floors to keep small canvases readable.
  - **Shaun Thumbnails**: YouTube thumbnail creator with Shaun Clark poses, positioning, headline/subtext
  - **Zoom Backgrounds**: Virtual background generator with AI background removal, 8 gradient styles, photo upload
  - **Biz Dev Templates (Virtual Workshop)**: Campaign pack generator — input headline, date, guest name, CTA, person photo (auto bg removal); generates 6 fixed template variants (QL 1080×1080, Portrait 1080×1350, Horizontal CTA/Dates/Day1/Day2 1920×1080); gallery output with individual + bulk download
  - **Super Promo**: Host + Guest campaign pack — input headline, date, CTA, host/guest names+titles+photos; multi-size (Horizontal 1920×1080, Vertical 1080×1920, Portrait 1080×1350, Square 1080×1080); variants (Dates/CTA/No Date/Day 1/Day 2/Replays); individual + ZIP export
  - **Super Promo 2**: Guest-only campaign pack (no Host) — same sizes/variants as Super Promo but with single centered speaker circle; separate background (`assets/superpromo2/`); individual + ZIP export
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
- **Dependencies**: `@workspace/integrations-openai-ai-server` for OpenAI, `@workspace/integrations-gemini-ai` for Gemini

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/brand-engine run dev` — run Brand Engine locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
