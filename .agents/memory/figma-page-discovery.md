---
name: Figma page discovery
description: Incomplete Figma MCP page enumeration and honest import coverage
---

Do not treat Figma's no-node metadata page list as a complete inventory when it conflicts with the user's visible file.

**Why:** The Level Up branding file returned only its Logos page, while the user could see many pages. Direct links to Community Posts, Emails, Social Covers, and Speaker Graphics resolved successfully. Large metadata responses were sometimes elided even in saved output.

**How to apply:** Use user-provided page or frame IDs, narrow oversized queries to individual frames, and distinguish inspected layouts from complete page imports. Never label portraits extracted from other pages as a complete import of the Photos page. Ask for that page's direct link or exported collection if its ID cannot be discovered.