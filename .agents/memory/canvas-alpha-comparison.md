---
name: Canvas alpha comparison
description: Verify locked PNG artwork without false failures from hidden RGB and canvas alpha encoding.
---

Compare alpha channels and visible composited colors when checking whether a canvas export preserves a locked transparent PNG. Raw RGBA differences alone can flag harmless hidden RGB changes.

**Why:** A real hero export showed nonzero raw differences outside its photo mask, while alpha, fully opaque pixels, and black/white composites were all identical to the original.

**How to apply:** Check native dimensions and alpha first, then compare opaque pixels and composites over black and white outside editable regions. Do not alter the supplied artwork to fix differences confined to invisible RGB.