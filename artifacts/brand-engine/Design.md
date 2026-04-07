# HighLevel Brand Engine Design System

## Purpose
This document defines the visual and structural rules for the HighLevel Brand Engine.

The goal is to ensure all generated designs feel:
- on-brand
- premium
- modern
- clear
- marketing-ready

This system should guide:
- template rendering
- thumbnail generation
- AI-assisted visuals
- CTA styling
- layout composition
- spacing and hierarchy

---

## Brand Essence

HighLevel should feel:
- growth-focused
- confident
- premium
- modern
- clear
- powerful
- simple

Designs should communicate:
- momentum
- automation
- performance
- trust
- clarity
- upward movement

---

## Visual Personality

HighLevel visuals should feel:
- sleek
- polished
- slightly futuristic
- premium SaaS
- high contrast
- spacious
- intentional

Avoid:
- clutter
- generic stock-template feel
- random colors
- weak hierarchy
- overdesigned effects

---

## Color System

### Core Colors
- Space Blue: `#07223D`
- Background Blue: `#095DC3`
- Nurture Blue: `#2896FB`
- White: `#FFFFFF`

### Accent Colors
- Capture Yellow: `#FFD000`
- Close Green: `#17D94B`

### Supporting Highlight
- Teal accent based on official brand guidance
- Use for subtle glow, orbit highlights, active states

### Rules
- Blue gradients dominate most compositions
- Yellow is reserved for CTA emphasis
- Green is used for success/check indicators
- Teal/blue glows should be subtle
- Do not overuse accent colors
- Keep palettes controlled and premium

---

## Gradient System

Backgrounds should use HighLevel-style gradients.

### Preferred Gradient Behavior
- dark navy to lighter blue
- subtle center glow
- slight teal or electric blue highlight
- optional soft radial lighting

### Rules
- gradients must feel clean and premium
- backgrounds should support text, not compete with it
- avoid random rainbow gradients
- avoid muddy or gray gradients
- use dark-to-light movement for depth

---

## Typography

### Font
- Primary: Poppins

### Headline Rules
- bold
- high contrast
- short
- easy to scan
- visually dominant

### Subheadline Rules
- supportive
- concise
- lighter weight than headline
- readable at smaller sizes

### CTA Rules
- short
- direct
- action-oriented

### Rules
- maintain strong hierarchy
- avoid long dense paragraphs
- use large type for key messages
- prioritize clarity over cleverness

---

## Layout Principles

All compositions should feel:
- structured
- spacious
- intentional
- marketing-ready

### Rules
- one focal point per design
- clear visual hierarchy
- consistent padding
- avoid crowding
- preserve breathing room
- balance text and image carefully

### Avoid
- random stacking
- weak alignment
- too many competing elements
- empty dead zones with no purpose

---

## Composition Types

### 1. Bold Hero
- dominant headline
- supporting subtext
- strong focal visual
- CTA if needed

### 2. Split Layout
- visual on one side
- text on the other
- clear directional composition

### 3. Announcement Style
- big headline
- simple supporting text
- one strong visual anchor

### 4. Product / UI Spotlight
- screenshot or interface behind/near focal subject
- clean supporting text
- premium spacing

### 5. Thumbnail Style
- strong centered or lower-third headline
- Shaun or mascot as focal subject
- screenshot behind subject when needed
- logo top-left
- strong contrast and clean hierarchy

---

## Spacing System

### General Rhythm
- large section spacing
- medium internal spacing
- tight spacing only for grouped text

### Rules
- spacing should feel premium and breathable
- avoid cramped panels
- maintain consistent padding
- allow assets to breathe

---

## Shape & Decorative Assets

Approved visual assets include:
- orbit rings
- swooshes
- bundles
- mascot elements
- gradient backgrounds

### Rules
- only use approved assets from brand library
- decorative shapes should support the composition
- do not overload the design
- use orbit/glow subtly for depth

---

## Logo Rules

### Use
- approved full HighLevel wordmark
- approved colored logo asset

### Rules
- logo should appear cleanly
- never stack icon and text separately unless intentionally designed
- avoid duplicate logo rendering
- top-left placement is preferred for thumbnails and branded visuals

---

## CTA Rules

CTA styling should feel:
- bold
- simple
- premium
- obvious but not cheap

### Default CTA Style
- yellow background
- dark text
- rounded corners
- strong visibility

### CTA Copy Examples
- Get Started
- Learn More
- Start Free Trial
- Book Demo

---

## Image Rules

### Allowed Image Types
- Shaun cutouts
- approved mascot art
- product screenshots
- UI screenshots
- approved brand visuals

### Rules
- use clean cutout images
- avoid low-quality or random stock visuals
- screenshot should support subject, not overpower subject
- Shaun or mascot should remain focal point
- use subtle glow/outline where appropriate

---

## Thumbnail Rules

These apply to creative packs like Shaun Comin Atcha.

### Thumbnail Structure
- background from approved dark blue assets
- logo top-left
- Shaun as focal subject
- optional screenshot behind Shaun
- large headline centered or lower-third
- subtext in white if used

### Headline Style
- bold Poppins
- all caps or strong title case
- subtle blue gradient allowed
- strong shadow if needed

### Subtext Style
- white
- smaller
- supportive only

### Screenshot Rules
- render behind Shaun
- adjustable opacity
- adjustable radius
- should not overpower subject
- used as depth/support layer

---

## AI Image Rules

These apply only to the Create section.

### AI Image Should
- feel like HighLevel
- use approved visual language
- follow brand colors
- use approved composition rules

### AI Image Should Not
- invent random styles
- use off-brand colors
- create generic template visuals
- look like unrelated AI art

---

## Create vs Creative Packs

### Create
Flexible system for:
- templates
- AI image
- size-based marketing assets

Can use:
- controlled variation
- brand system
- structured generation

### Creative Packs
Fixed systems for:
- Shaun Comin Atcha
- Content Army
- Super Promo
- Master Class
- Certified Admin

Must use:
- predefined layouts
- fixed composition rules
- controlled assets
- no random layout generation

---

## UI Design Rules

The Brand Engine UI should feel:
- modern
- fluid
- premium
- non-boxy
- intuitive for non-designers

### UI Style
- subtle glassmorphism
- dark blue gradient environment
- layered depth
- soft glows
- rounded corners
- smooth hover states

### Avoid
- harsh borders
- rigid admin-dashboard feel
- excessive empty space
- overly technical controls

---

## Validation Rules

Before rendering a design, validate:

- Is the background on-brand?
- Is hierarchy strong?
- Is text readable?
- Is the logo correct?
- Is the focal subject clear?
- Are screenshots behind the subject?
- Does it feel like HighLevel?
- Does it avoid generic SaaS/template vibes?

If not, fallback to safer composition.

---

## Output Standard

Every final output should feel:
- premium
- branded
- clean
- readable
- marketable
- intentionally designed

If unsure:
- simplify
- reduce clutter
- strengthen hierarchy
- use approved assets only
- prioritize brand consistency

---

## Brand Asset Library

All approved brand assets are stored locally in `public/assets/`. Reference them via `/assets/` paths in the app.

### Shaun Cutouts (`/assets/shaun/`)
Transparent PNG cutouts of Shaun Clark for thumbnails and compositions.

| File | Usage |
|------|-------|
| `ShaunClark_03057_StudioSura-Photoroom.png` | Pose 1 |
| `ShaunClark_03096_StudioSura-Photoroom.png` | Pose 2 |
| `ShaunClark_03141_StudioSura-Photoroom.png` | Pose 3 |
| `ShaunClark_03182_StudioSura-Photoroom.png` | Pose 4 |
| `ShaunClark_03235_StudioSura-Photoroom.png` | Pose 5 |
| `ShaunClark_03269_StudioSura-Photoroom.png` | Pose 6 |

### Dark Backgrounds (`/assets/backgrounds-dark/`)
Approved dark-theme background textures with planet, gradient, and radial effects.

| File | Description |
|------|-------------|
| `Type=Centered Planet.png` | Centered planet glow |
| `Type=Core Gradient.png` | Core brand gradient |
| `Type=Large Planet Bottom Right.png` | Large planet bottom-right |
| `Type=Planet Bottom Right.png` | Planet bottom-right |
| `Type=Planet Ray Bottom Right.png` | Planet with ray bottom-right |
| `Type=Radial Shine Bottom Left.png` | Radial shine bottom-left |
| `Type=Radial Shine Bottom RIght.png` | Radial shine bottom-right |
| `Type=Small Planet Bottom Right.png` | Small planet bottom-right |
| `Type=Small Radial Shine Right.png` | Small radial shine right |

### Light Backgrounds (`/assets/backgrounds-light/`)
Light-theme background options.

| File | Description |
|------|-------------|
| `Property 1=Centered Horizon.png` | Centered horizon light |
| `Property 1=Neutral.png` | Neutral light background |

### Logos (`/assets/logos/`)
Official HighLevel logo variants for all contexts.

| File | Variant |
|------|---------|
| `Lockup=Full Horizontal, Color=AllDarkBlue.png` | Full horizontal, all dark blue |
| `Lockup=Full Horizontal, Color=AllWhite.png` | Full horizontal, all white |
| `Lockup=Full Horizontal, Color=Dark.png` | Full horizontal, dark |
| `Lockup=Full Horizontal, Color=Light.png` | Full horizontal, light |
| `Lockup=Icon, Color=Dark.png` | Icon only, dark |
| `Lockup=Icon, Color=Full.png` | Icon only, full color |
| `Lockup=Icon, Color=Light.png` | Icon only, light |
| `Lockup=Wordmark, Color=Dark.png` | Wordmark only, dark |
| `Lockup=Wordmark, Color=Light.png` | Wordmark only, light |
| `Shape=Circle, Color=OnDarkBlue.png` | Circle badge, on dark blue |
| `Shape=Circle, Color=OnWhite.png` | Circle badge, on white |
| `Shape=Light Mode Rounded Square, Color=OnDarkBlue.png` | Rounded square, on dark blue |
| `Shape=RoundedSquare, Color=OnWhite.png` | Rounded square, on white |
| `Shape=Square, Color=OnDarkBlue.png` | Square badge, on dark blue |
| `Shape=Square, Color=OnWhite.png` | Square badge, on white |

### Orbit Rings (`/assets/orbits/`)
Decorative orbit/ring graphics for depth and visual interest.

| File | Variant |
|------|---------|
| `Rings=6 Ring, Color=Backer.png` | 6-ring, Backer |
| `Rings=6 Ring, Color=Capture.png` | 6-ring, Capture |
| `Rings=6 Ring, Color=Close.png` | 6-ring, Close |
| `Rings=6 Ring, Color=Dark.png` | 6-ring, Dark |
| `Rings=6 Ring, Color=Engine Light.png` | 6-ring, Engine Light |
| `Rings=6 Ring, Color=Nurture.png` | 6-ring, Nurture |
| `Rings=6 Ring, Color=Standard.png` | 6-ring, Standard |
| `Rings=8 Ring, Color=Backer.png` | 8-ring, Backer |
| `Rings=8 Ring, Color=Capture.png` | 8-ring, Capture |
| `Rings=8 Ring, Color=Close.png` | 8-ring, Close |
| `Rings=8 Ring, Color=Engine Dark.png` | 8-ring, Engine Dark |
| `Rings=8 Ring, Color=Engine Light.png` | 8-ring, Engine Light |
| `Rings=8 Ring, Color=Nurture.png` | 8-ring, Nurture |
| `Rings=8 Ring, Color=Standard.png` | 8-ring, Standard |

### Bundles (`/assets/bundles/`)
Product bundle badge graphics in three color variants and three styles.

| File | Style / Color |
|------|---------------|
| `Type=Narrow, Color=Capture Yellow.png` | Narrow, Capture Yellow |
| `Type=Narrow, Color=Close Green.png` | Narrow, Close Green |
| `Type=Narrow, Color=Nurture Blue.png` | Narrow, Nurture Blue |
| `Type=Product UI (Frosted), Color=Capture Yellow.png` | Frosted UI, Capture Yellow |
| `Type=Product UI (Frosted), Color=Close Green.png` | Frosted UI, Close Green |
| `Type=Product UI (Frosted), Color=Nurture Blue.png` | Frosted UI, Nurture Blue |
| `Type=Wide, Color=Capture Yellow.png` | Wide, Capture Yellow |
| `Type=Wide, Color=Close Green.png` | Wide, Close Green |
| `Type=Wide, Color=Nurture Blue.png` | Wide, Nurture Blue |

### Highly Mascot (`/assets/highly/`)
Highly mascot character poses for compositions.

| File | Pose |
|------|------|
| `Highly_Flying 1.png` | Flying |
| `Highly_Hi 1.png` | Waving hi |
| `Highly_Pose_GrabRight 1.png` | Grab right |

### Icons (`/assets/icons/`)
Glassmorphic feature icons for product sections.

| File | Icon |
|------|------|
| `Icon=Capture, Glass=Dark, Color=None (Glass).png` | Capture (dark glass) |
| `Icon=Capture, Glass=Medium, Color=None (Glass).png` | Capture (medium glass) |
| `Icon=Close, Glass=Medium, Color=None (Glass).png` | Close (medium glass) |
| `Icon=Evangelize, Glass=Medium, Color=None (Glass).png` | Evangelize (medium glass) |
| `Icon=Nurture, Glass=Medium, Color=None (Glass).png` | Nurture (medium glass) |
| `Icon=Reactivate, Glass=Medium, Color=None (Glass).png` | Reactivate (medium glass) |
