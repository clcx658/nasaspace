---
name: AstroPath Mission OS
colors:
  surface: '#101221'
  surface-dim: '#101221'
  surface-bright: '#363849'
  surface-container-lowest: '#0b0d1c'
  surface-container-low: '#191a2a'
  surface-container: '#1d1f2e'
  surface-container-high: '#272939'
  surface-container-highest: '#323444'
  on-surface: '#e1e1f7'
  on-surface-variant: '#bac9cc'
  inverse-surface: '#e1e1f7'
  inverse-on-surface: '#2d2f40'
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
  on-background: '#e1e1f7'
  surface-variant: '#323444'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-sm:
    fontFamily: Outfit
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Outfit
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Outfit
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Outfit
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Outfit
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-md: 1.5rem
  margin: 1rem
  margin-md: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system blends **Tactile Skeuomorphism** with **Vibrant Sci-Fi HUD** sensibilities, calibrated specifically for cadets aged 7–12. The experience captures the wonder of lunar exploration by transforming technical mission metrics into playful, arcade-grade gamification.

### Visual Pillars
- **Chunky Arcade Tactility**: Controls possess physical depth through solid drop bevels, thick borders, and satisfying downward travel (`active:translate-y-1`) that simulate rubberized dashboard hardware.
- **Cosmic Deep-Space Contrast**: Surfaces leverage deep abyssal navy backdrops accented by luminescent neon gauges (Electric Cyan, Solar Gold, Hydro Green) to evoke a lively lunar habitat interior.
- **Soft & Inviting Geometry**: Aggressively rounded containers and pill shapes prevent any clinical intimidation, maintaining a friendly, optimistic, and welcoming tone.
- **Authentic Junior Scientific HUD**: Isometric grid layouts, bolt-fastened structural panels, and telemetry badges foster pride and immersion without overwhelming young readers.

## Colors

The palette simulates a moon base console peering out into deep space, pairing ultra-deep canvas values with punchy, high-emission status tones.

### Palette Roles
- **Canvas Base (`#0b0d1b`)**: Unfathomable deep-space cosmic void; houses the starry backdrop and isometric regolith field.
- **Surface Elevation (`#101221`)**: Base container panels, HUD chassis, modal screens.
- **Surface Accent & Borders (`#1d2138` / `#282d4d`)**: Structural panel seams, internal card containers, and inactive progress bar grooves.
- **Electric Cyan (`#00e5ff`)**: Primary telemetry interactive color, primary calls-to-action, Oxygen tracking, and crystalline resource nodes.
- **Solar Gold / Flare Yellow (`#ffb300` / `#ffe600`)**: Power reserves, mission badges, XP rewards, rank promotions, and mechanical hazard alerts.
- **Hydro Green (`#00e676`)**: Biodome cultivation, cadet health, life support stability, and completed checklist confirmations.
- **Alert Coral (`#ff3d00`)**: Solar radiation warnings, critical resource depletion, emergency drills, and system locks.
- **Starlight White (`#ffffff`) & Soft Starfall (`#c8d3f5`)**: Primary and secondary content, data readouts, labels, and iconography.

## Typography

Outfit drives high readability for early readers through open counters, geometric circular curves, and distinct letterforms. 

- **Display & Headlines**: Heavy weights (`700` and `800`) provide an animated arcade feel. Use display scales for mission rank updates, sol transitions, and major discovery prompts.
- **Numbers & Metrics**: Outfit's tabular and geometric figures ensure energy percentages, time stamps, and sample tallies do not jitter during real-time countdowns.
- **Scientific Disclaimers & Telemetry**: Rendered in `label-sm` or `label-md` with uppercase tracking (`+0.05em`) for clarity and an authentic aerospace telemetry cadence.

## Layout & Spacing

The interface uses a contextual HUD layout framing a persistent 2D isometric viewport.

- **Safe Zones & Overlays**: All telemetry HUD modules sit 16px inset from view edges on mobile devices and 32px on tablets and desktop monitors.
- **Touch Targets**: Minimum target dimensions for all interactive mission buttons, module switches, and quick-dials are 48×48px to accommodate younger motor skills.
- **Layout Rhythm**: Dynamic bottom sheet dialogs and side drawers collapse into clean pill triggers during active lunar exploration mode to maximize terrain visibility.

## Elevation & Depth

This system departs from soft blurred drop shadows, utilizing **Tactile Bevel Extrusions** combined with **Atmospheric Bioluminescence**.

### Bevel Extrusions (Tactile Depth)
- **Primary Buttons (Cyan)**: Solid 4px offset base (`box-shadow: 0 4px 0 #009bb0`).
- **Reward / Energy Buttons (Solar Gold)**: Solid 4px offset base (`box-shadow: 0 4px 0 #d99800`).
- **Emergency Actions (Coral)**: Solid 4px offset base (`box-shadow: 0 4px 0 #b32a00`).
- **Active State Physics**: Elements translate downward on tap (`transform: translateY(4px)`) while the solid shadow collapses to `0 0 0`, simulating a mechanical physical switch.

### Panel Elevation & Glassmorphism
- Panels combine `#101221` with `90%` opacity and `backdrop-filter: blur(12px)`.
- **Rivet Corners**: Panels feature 2px inner borders (`#282d4d`) with metallic 4px circular faux-screws at corner intersections.
- **Bioluminescent Edge Glow**: Interactive panels feature soft accent halos (`box-shadow: 0 0 16px rgba(0, 229, 255, 0.15)`).

## Shapes

The design uses soft, rounded curves (`roundedness: 3`) to evoke inflatable habitat modules, rounded spacesuit visors, and friendly companion robotics.

- **Action Buttons & Chips**: Fully pill-shaped (`rounded-full` / `9999px`).
- **Panels & Dialog Windows**: Rounded 24px (`rounded-3xl`) to 32px for friendly outer chassis geometry.
- **Meters & Progress Tracks**: Fully rounded tracks featuring encapsulated rounded pill progress fills.

## Components

### 1. Tactile 3D Action Buttons
- **Primary Action (Cyan)**: Pill button with `#00e5ff` background, navy bold text (`#0b0d1b`), and solid bottom lip (`#009bb0`). On press, translate downward by 4px with zero lip shadow.
- **Secondary Action (Subdued)**: Background `#1d2138`, starlight text (`#ffffff`), 2px border `#282d4d`, with a solid lip of `#101221`.
- **Solar Glory (Claim / Collect)**: `#ffe600` background with `#d99800` base lip and energetic bounce animation upon mission completion.

### 2. Habitat & HUD Cards
- Dual-layered structures featuring an outer `#1d2138` border ring and inner deep navy chassis `#101221`.
- Glass-like top specular highlight: A subtle 1px inner top border (`border-t: 1px solid rgba(255, 255, 255, 0.2)`).
- Card headers pair uppercase category badges with cute, illustrated mission icons.

### 3. Resource HUD Gauges
- Thick 16px to 24px horizontal and radial status capsules.
- Deep recessed background groove (`#0b0d1b`) with a 1px border (`#282d4d`).
- Glowing meter fills:
  - **Oxygen**: Electric Cyan (`#00e5ff`) with bubbling particle icons.
  - **Power**: Solar Gold (`#ffe600`) with lightning indicators.
  - **Water**: Aqua Blue (`#00b0ff`) with liquid droplet indicators.
  - **Health**: Hydro Green (`#00e676`) with pulsing heartbeat waveforms.
  - **Radiation Shield**: Alert Coral (`#ff3d00`) with hazard-shield icons.
- **Educational Telemetry Disclaimer**: Persistent, clean micro-text pinned beneath mission gauges:
  `"SIMULATED GAMEPLAY VALUES — NOT REAL NASA MEASUREMENTS"`.

### 4. Navigation & Telemetry Bars
- **Sol & Habitat Status Header (Top)**: Floating pill docked at top center showing `SOL 42`, real-time mission clock, and habitat status badges with glowing ambient indicators.
- **Adventure Navigation Dock (Bottom)**: Floating glass dock housing 5 action tabs:
  1. *Explore* (Lunar buggy icon)
  2. *Base HQ* (Inflatable dome icon)
  3. *Rover* (Companion bot icon)
  4. *Research* (Microscope / crystal icon)
  5. *Comms* (Satellite dish icon)
- Active tabs lift upward by 6px with a gold or cyan indicator halo.

### 5. Mascot & Companion Elements
- Chibi-proportioned junior astronauts with golden visors that mirror surrounding lunar terrain.
- Companion Rover status bubbles equipped with animated LED expression eyes (happy arches, curious dots, scanning bars).

### 6. Lunar Environmental Presentation
- Isometric terrain rendered in muted purplish-charcoal regolith with glowing cyan crystal deposits and illuminated airlock pathways.
- The Earth hangs in the starry upper void, wrapped in a faint atmospheric cyan halo.