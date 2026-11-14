---
name: A Day on the Moon Design System
colors:
  surface: '#101221'
  surface-dim: '#101221'
  surface-bright: '#363848'
  surface-container-lowest: '#0b0d1b'
  surface-container-low: '#191b29'
  surface-container: '#1d1f2d'
  surface-container-high: '#272938'
  surface-container-highest: '#323443'
  on-surface: '#e1e1f5'
  on-surface-variant: '#bac9cc'
  inverse-surface: '#e1e1f5'
  inverse-on-surface: '#2e2f3f'
  outline: '#849396'
  outline-variant: '#3b494c'
  surface-tint: '#00daf3'
  primary: '#c3f5ff'
  on-primary: '#00363d'
  primary-container: '#00e5ff'
  on-primary-container: '#00626e'
  inverse-primary: '#006875'
  secondary: '#ffd799'
  on-secondary: '#432c00'
  secondary-container: '#feb300'
  on-secondary-container: '#6a4800'
  tertiary: '#b1ffbf'
  on-tertiary: '#003918'
  tertiary-container: '#22ef7e'
  on-tertiary-container: '#006731'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#9cf0ff'
  primary-fixed-dim: '#00daf3'
  on-primary-fixed: '#001f24'
  on-primary-fixed-variant: '#004f58'
  secondary-fixed: '#ffdeac'
  secondary-fixed-dim: '#ffba38'
  on-secondary-fixed: '#281900'
  on-secondary-fixed-variant: '#604100'
  tertiary-fixed: '#62ff96'
  tertiary-fixed-dim: '#00e475'
  on-tertiary-fixed: '#00210b'
  on-tertiary-fixed-variant: '#005226'
  background: '#101221'
  on-background: '#e1e1f5'
  surface-variant: '#323443'
typography:
  display-hero:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '900'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '900'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '800'
    lineHeight: 32px
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-sm:
    fontFamily: Outfit
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  body-lg:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
  body-md:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-sm:
    fontFamily: Outfit
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-lg:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '800'
    lineHeight: 20px
    letterSpacing: 0.04em
  label-md:
    fontFamily: Outfit
    fontSize: 13px
    fontWeight: '800'
    lineHeight: 16px
    letterSpacing: 0.06em
  label-sm:
    fontFamily: Outfit
    fontSize: 11px
    fontWeight: '800'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-tablet: 1.25rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style
This design system defines the aesthetic and functional interface for an interactive, child-friendly 2D isometric lunar adventure and educational life simulation tailored for ages 7–12. 

The visual style is **Tactile Arcade Futurism**: a high-contrast, playful, cosmic aesthetic that fuses punchy arcade game mechanics with accessible educational UI. The experience balances scientific curiosity with gamified wonder, evoking excitement, clarity, and agency. 

Key attributes:
- **Child-Accessible & Touch-First:** Generous, tactile targets (minimum 48px touch bounding boxes), chunky borders, and obvious visual affordances.
- **Cosmic Game Shell:** Deep void backgrounds contrasted against high-luminance neon indicators, simulated glowing telemetry monitors, and punchy cartoon astronaut gear.
- **Physicality & Tactility:** 3D-extruded buttons with explicit physical travel (`transform: translateY` on active state), high-contrast borders, and rounded shapes resembling pressurized spacesuit elements.

## Colors
The palette balances deep lunar space tones with hyper-saturated warning, oxygen, energy, and telemetry signals to support immediate child recognition and accessibility:

- **Deep Space Navy (`#0b0d1b`):** The primary universe backdrop, framing canvases and game-world viewports.
- **Dark Navy (`#101221`):** Base layer for HUD containers, cockpit frames, dialogue bubbles, and modal backing.
- **Electric Cyan (`#00e5ff`):** Primary interactive accent; used for communication systems, water indicators, interactive science tools, and primary CTAs.
- **Solar Gold (`#ffb300`):** Secondary interactive accent; signals solar power, mission achievements, XP, and critical mission highlights.
- **Bright Yellow (`#ffe600`):** High-energy attention drawer for star ratings, active quest markers, and spark highlights.
- **Hydro Green (`#00e676`):** Tertiary status color representing oxygen levels, life support status, plant growth progress, and successful quest completions.
- **Alert Coral (`#ff3d00`):** Hazard and urgent alert status; warns of low battery, meteor showers, decompression, or failed mini-games.

All interactive elements must maintain an intentional 3-layer color model: highlight reflection edge, base fill, and darker bottom extrusion rim.

## Typography
Typography is set entirely in **Outfit**, an ultra-friendly geometric sans-serif that balances modern high-tech legibility with warm, rounded letterforms suitable for young readers.

- **Weight Strategy:** Weights skew heavy (`600` to `900`) to guarantee high-speed legibility against dark galactic surfaces and animated 2D isometric scenes.
- **Labels & Numbers:** Metrics, countdowns, and telemetry labels use uppercase styling with enhanced letter-spacing for rapid visual processing during simulation mini-games.
- **Text Readability:** All running educational copy maintains generous line-heights and avoids low-contrast gray variations. Pure white or pale tinted cyan text is strictly enforced over dark backgrounds.

## Layout & Spacing
The layout follows a responsive gaming shell framework with an adaptive fluid HUD perimeter and a flexible central stage.

- **Screen Adaptations:**
  - **Mobile / Handheld (< 640px):** HUD pinned to extreme corners with thumb-reachable lower clusters. Margins are locked to `1rem` to maximize lunar viewport space.
  - **Tablet (641px - 1024px):** Primary target for classroom tablets. Modular HUD trays dock symmetrically left and right with `1.5rem` outer margins.
  - **Desktop / Large Displays (> 1025px):** Fixed aspect-ratio canvas (16:9 or 16:10) centered within the Deep Space Navy viewport, flanked by mission status strips.
- **Spacing Rhythm:** Built around an 8px root grid (`0.5rem`). Component padding scales generously to support rapid, imprecise tapping by younger players.

## Elevation & Depth
Elevation is rendered through tactile arcade layering, mechanical bevels, and atmospheric neon luminescence rather than standard blurry drop shadows.

- **3D Arcade Extrusion:** Interactive elements feature solid bottom offsets (4px–6px) rendered in a darker tone of the element's primary color, creating a physical arcade push-button feel.
- **Active Physics:** On tap or press, the button face shifts downward (`translateY(4px)`), collapsing the extrusion bevel to simulate genuine mechanical travel.
- **Borders & Shell Frames:** Modal windows, HUD panels, and equipment cards use crisp 2px to 3px solid borders in high-contrast cyan or soft electric blue, reinforcing airtight spacesuit visor styling.
- **Neon Luminescence:** Mission-critical alerts and ready-to-click controls cast tight glowing ambient halos using dual inset and outset drops (`0 0 16px rgba(0, 229, 255, 0.45)`).
- **Surface Tiers:**
  - *Tier 0 (Void):* Deep Space Navy (`#0b0d1b`) background.
  - *Tier 1 (Panels & Cockpits):* Dark Navy (`#101221`) with 2px solid perimeter rings.
  - *Tier 2 (Interactive Floating Trays):* Semi-translucent Midnight Navy (`rgba(16, 18, 33, 0.85)`) with backdrop blur (12px).
  - *Tier 3 (Overlay Dialogues & Modals):* High-saturation popouts with bright accent borders and punchy backdrop scrims.

## Shapes
The shape language uses pill-shaped geometry (`roundedness: 3`) to echo space capsules, astronaut helmet viewports, oxygen tanks, and classic cartoon space gear.

- **Pill Philosophy:** Buttons, status badges, telemetry bars, and resource chips use fully rounded pill profiles (`9999px` / `rounded-full`).
- **Cards & Viewport Frames:** Modals and inventory cards employ heavy roundedness (`rounded-3xl` / 24px–32px corner radius) to eliminate aggressive edges, keeping the tone safe, approachable, and playful.
- **Inner Content Nesting:** Inner containers maintain concentric curvature proportional to their parent frames.

## Components

### 1. Arcade Push Buttons
- **Geometry:** Fully rounded pill shapes with minimum height of 52px (mobile) and 60px (desktop).
- **Styling:** Saturated top fill (Electric Cyan `#00e5ff` or Solar Gold `#ffb300`), 3px solid top-surface highlight border, and a 6px solid bottom extrusion bevel (e.g., `#009bb0` or `#c68400`).
- **Interaction:** `:active` state triggers a `transform: translateY(4px)` while flattening the bottom bevel to 2px, accompanied by a soft neon glow flash.

### 2. Glowing Pill Badges & Telemetry Chips
- **Geometry:** Height of 28px–36px with full pill curvature.
- **Styling:** Translucent Dark Navy fill with 2px colored border matching the telemetry type:
  - *Oxygen:* Hydro Green border with a glowing oxygen tank icon.
  - *Power:* Solar Gold border with solar flare icon.
  - *Water:* Electric Cyan border with droplet indicator.
- **Typography:** Outfit Label-MD (`800` weight) in crisp uppercase.

### 3. Playful HUD Telemetry & Resource Bars
- **Track:** 16px–24px tall rounded-full trough in deep navy with an inset border.
- **Fill:** Multi-stop animated linear gradient (e.g., `#00e5ff` to `#00e676` for biological systems, `#ffb300` to `#ffe600` for energy banks).
- **Indicators:** Segment tick marks styled like lunar base suit monitors, featuring a pulsing light pip at the current value tip.

### 4. Astronaut Dialogue & Educational Cards
- **Geometry:** 24px rounded corners with a 3px Electric Cyan or Solar Gold outer stroke.
- **Header:** Integrated mascot medallion (e.g., Cartoon Rover or Astro-Guide) breaking the top border boundary.
- **Typography:** Body-LG with clear line breaks and highlighted keyword badges for educational takeaways.

### 5. Selection Controls (Checkboxes & Radios)
- **Checkboxes:** Chunky 28x28px rounded squares (8px radius) with deep tactile bevels; active state displays a bold cartoon checkmark in Hydro Green.
- **Radios:** 30x30px concentric circles with an illuminated Electric Cyan center core when engaged.

### 6. Lunar Tool Input Fields
- **Container:** Dark Navy pill or 16px rounded-rect with a 2px inner border.
- **Focus:** Transitions border from subtle steel navy to intense Electric Cyan with a soft outer glow. Includes large, kid-friendly clear ("X") buttons.

### 7. Quest & Inventory Grid Cells
- **Geometry:** Square rounded containers (16px corner radius) featuring a recessed inset shadow simulating modular airlock storage bays.
- **Rarity / Status Frames:** Color-coded borders indicating mission progression (Common Gray, Discovery Cyan, Stellar Gold).