---
name: html-to-image font fallback on export
description: Why downloaded images lose their fonts and how to make exports keep brand fonts.
---

# html-to-image exports fall back to system fonts

**Symptom:** the live preview uses the right fonts but the downloaded PNG/JPEG shows different (system fallback) fonts.

**Cause:** fonts loaded from Google Fonts (`fonts.googleapis.com`) are cross-origin. html-to-image cannot fetch/inline cross-origin font CSS (CORS), so code either strips the Google `<link>`s or passes `skipFonts:true` to avoid errors — both leave the capture with no embeddable fonts, so it renders with system fallback.

**Fix:** self-host the woff2 files (Vite-bundled, same-origin) and pass an explicit `fontEmbedCSS` to `toPng`/`toJpeg`. Build it by fetching each same-origin woff2, base64-encoding it, and emitting `@font-face{...src:url(data:...) format('woff2')}` rules. When `fontEmbedCSS` is provided, html-to-image uses it directly and skips scanning stylesheets entirely (so cross-origin sheets no longer matter). Cache the built string — it's large (Inter weights are ~47KB each).

**Why:** `fontEmbedCSS` is the documented escape hatch; self-hosting makes the bytes same-origin-fetchable. Keeping Google Fonts for the preview is fine — only the export needs the embedded copy.

**How to apply:** any html-to-image export that must preserve non-system fonts. Note each call site is independent — fixing the shared export hook does NOT fix workspaces that call `toPng` directly with their own options.
