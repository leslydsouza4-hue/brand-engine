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
  - **Templates**: Category-based template picker (Social/Ads/Presentation) with live preview
  - **Shaun Thumbnails**: YouTube thumbnail creator with Shaun Clark poses, positioning, headline/subtext
  - **Zoom Backgrounds**: Virtual background generator with AI background removal, 8 gradient styles, photo upload
  - **AI Image**: Multi-model AI image generation with model picker UI
    - **Nano Banana 2** (`gemini-2.5-flash-image`) — ultra-fast generation via Gemini
    - **Nano Banana Pro** (`gemini-3-pro-image-preview`) — high-quality details via Gemini
    - **GPT-4** (`gpt-image-1`) — OpenAI image model
- **Design system**: Deep navy (#060B16), brand teal (#00B2A9), electric blue (#2896FB), CTA yellow (#FFD000)
- **Fonts**: Inter + Poppins (Google Fonts)
- **AI Features**:
  - Background removal via `@imgly/background-removal` (npm package, runs client-side)
  - AI image generation via Gemini (default) and OpenAI gpt-image-1, Replit AI Integration (no API key required, billed to Replit credits)
  - Model picker with animated dropdown in prompt bar (primary) and inline select in regenerate bar
- **API Proxy**: Vite dev server proxies `/api` to API server at `http://localhost:8080`
- **Assets**: Shaun images from GitHub raw URLs

### API Server (`artifacts/api-server`)
- **Type**: Express 5 API
- **Port**: 8080
- **Routes**:
  - `GET /api/healthz` — health check
  - `POST /api/openai/generate-image` — OpenAI gpt-image-1 generation (prompt, size, count); basic rate limiting (5s between requests)
  - `POST /api/gemini/generate-image` — Gemini image generation (prompt, aspectRatio, style); supports Nano Banana 2 and Pro models
  - `POST /api/descript/fetch-meta` — Fetch OG metadata (title, thumbnail) from a Descript share URL
- **Dependencies**: `@workspace/integrations-openai-ai-server` for OpenAI, `@workspace/integrations-gemini-ai` for Gemini

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/brand-engine run dev` — run Brand Engine locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
