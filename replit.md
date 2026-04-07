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
- **Type**: React + Vite web app (frontend-only)
- **Route**: `/`
- **Description**: HighLevel-branded creative tool for generating marketing assets
- **Workspaces**:
  - **Templates**: Category-based template picker (Social/Ads/Presentation) with live preview
  - **Shaun Thumbnails**: YouTube thumbnail creator with Shaun Clark poses, positioning, headline/subtext
  - **Zoom Backgrounds**: Virtual background generator with AI background removal, 8 gradient styles, photo upload
- **Design system**: Deep navy (#060B16), brand teal (#00B2A9), electric blue (#2896FB), CTA yellow (#FFD000)
- **Fonts**: Inter + Poppins (Google Fonts)
- **AI Feature**: Background removal via `@imgly/background-removal` (loaded from esm.run CDN)
- **Assets**: Shaun images from GitHub raw URLs

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/brand-engine run dev` — run Brand Engine locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
