---
name: Gemini/OpenAI integration libs run from src, not dist
description: Why editing lib/integrations-*-ai source takes effect at runtime even though `tsc --build` of the libs fails.
---

# Integration libs are consumed from `src`, not `dist`

`lib/integrations-gemini-ai` (and the openai sibling) declare `exports` pointing straight at `./src/*.ts`, and consuming artifacts bundle with esbuild. So esbuild compiles the lib's TypeScript source directly into the server bundle.

**Consequence:** editing a lib's source (e.g. adding a param to `generateImage`) takes effect at runtime after a workflow restart — you do NOT need to rebuild the lib's `dist`.

**Why:** `tsc --build` of these libs currently fails with pre-existing errors, so `dist` is stale/empty and `tsc --noEmit` of consumers reports TS6305 ("Output file … has not been built"). That TS6305 is pre-existing noise, not caused by your edit.

**How to apply:** after editing an integration lib, restart the consuming workflow and verify at runtime (curl the route). Don't chase TS6305 or rebuild dist — confirm your own edited files are clean and the route works.
