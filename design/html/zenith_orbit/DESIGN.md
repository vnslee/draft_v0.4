---
name: Zenith Orbit
colors:
  surface: '#121317'
  surface-dim: '#121317'
  surface-bright: '#38393e'
  surface-container-lowest: '#0d0e12'
  surface-container-low: '#1a1b20'
  surface-container: '#1e1f24'
  surface-container-high: '#292a2e'
  surface-container-highest: '#333539'
  on-surface: '#e3e2e8'
  on-surface-variant: '#bcc9cd'
  inverse-surface: '#e3e2e8'
  inverse-on-surface: '#2f3035'
  outline: '#869397'
  outline-variant: '#3d494c'
  surface-tint: '#4cd7f6'
  primary: '#4cd7f6'
  on-primary: '#003640'
  primary-container: '#06b6d4'
  on-primary-container: '#00424f'
  inverse-primary: '#00687a'
  secondary: '#adc6ff'
  on-secondary: '#002e6a'
  secondary-container: '#0566d9'
  on-secondary-container: '#e6ecff'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#1bbd85'
  on-tertiary-container: '#00452e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#acedff'
  primary-fixed-dim: '#4cd7f6'
  on-primary-fixed: '#001f26'
  on-primary-fixed-variant: '#004e5c'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#121317'
  on-background: '#e3e2e8'
  surface-variant: '#333539'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.15em
  stat-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 20px
---

## Brand & Style

The design system is engineered for high-stakes global expansion analysis, evoking the precision of a satellite command center. It targets executives and strategists who require institutional-grade data clarity wrapped in a cutting-edge, futuristic aesthetic. 

The visual style is a fusion of **Glassmorphism** and **Corporate Modernism**, set against an infinite dark void. Surfaces feel like physical glass layers floating in space, utilizing deep-background blurs, microscopic inner highlights, and subtle neon refractions. The emotional response is one of absolute authority, technological sophistication, and data-driven confidence.

**Visual Principles:**
- **Atmospheric Depth:** Use multi-layered translucent surfaces to create a clear spatial hierarchy.
- **Precision Mechanics:** UI elements should feature razor-thin borders and high-contrast typography to emphasize accuracy.
- **Luminous Intent:** Color is used sparingly as a functional signal—glows and neon accents draw the eye to critical market status changes and data connections.

## Colors

The palette is anchored in **Cosmic Void (#040508)**, a deep, navy-tinted black that provides infinite depth. This is contrasted by high-energy luminous accents that serve both aesthetic and functional roles.

- **Primary (Cyan Aura):** Used for interactive triggers, primary networks, and active paths.
- **Secondary (Electric Blue):** Used for secondary data visualizations and transport routes.
- **Neutral (Obsidian Foundation):** A range of slate-tinted blacks and grays used for structural surfaces and borders.
- **Semantic Signals:**
    - **Neon Green:** Status: *Entered Market*.
    - **Neon Amber:** Status: *Planned/Pending Expansion*.
    - **Neon Red:** Status: *Regulatory Barrier / Risk*.

Apply a subtle 2% opacity grain overlay across the entire UI to give these digital colors a tactile, hardware-terminal feel.

## Typography

Typography is designed for maximum legibility in a low-light environment. 

- **Geist** is used for headlines and statistics, offering a geometric, technical feel that conveys precision. 
- **Inter** handles all body copy and prose, ensuring clean readability for complex market reports.
- **JetBrains Mono** is reserved for technical labels, coordinates, and metadata, reinforcing the "command center" aesthetic.

**Numeric Styling:** Always use tabular figures (`font-variant-numeric: tabular-nums`) for data tables and tickers to ensure vertical alignment of digits across columns.

## Layout & Spacing

The design system utilizes a **Bento Box Dashboard** philosophy, arranging complex data into asymmetrical grid layouts that prioritize hierarchical flow over perfect symmetry.

- **Grid System:** A 12-column fluid grid on desktop, transitioning to a single-column stack on mobile.
- **Spacing Rhythm:** Based on a 4px scale. 
- **Density:** Use tight spacing (`sm` to `md`) within data-heavy cards and tables, but generous breathing room (`2xl` or greater) between major dashboard modules to prevent cognitive overload.
- **Breakpoints:**
    - Mobile: < 768px (20px margins)
    - Tablet: 768px - 1280px (32px margins)
    - Desktop: > 1280px (40px margins, max-width 1440px)

## Elevation & Depth

Visual hierarchy is established through a **Double-Bezel Glassmorphism** technique rather than traditional ambient shadows.

- **Layer 0 (Void):** The base background (#040508) with a mesh gradient glow in the corners.
- **Layer 1 (Standard Card):** A surface of #0a0d14 at 70% opacity with `backdrop-blur-2xl`. It features a 1px border (#1e293b).
- **Layer 2 (Elevated/Floating):** Use a secondary inner container with an inset shadow (`shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]`) and a brighter border (#334155).
- **Interactive Depth:** When hovered, cards should increase their backdrop blur and the border should adopt a subtle primary color glow (`shadow-[0_0_20px_rgba(6,182,212,0.15)]`).

## Shapes

The shape language balance geometric precision with soft, modern ergonomics.

- **Base Radius:** 0.5rem (8px) for standard inputs and small widgets.
- **Large Radius:** 1rem (16px) for main dashboard cards and modules.
- **Pill Shapes:** Used exclusively for interactive buttons, status chips, and the floating navigation bar to distinguish them from structural containers.
- **Concentric Radii:** When nesting containers, ensure the inner radius is calculated as `Outer Radius - Padding` to maintain a professional, optical balance.

## Components

### Buttons
- **Primary:** Full pill-shaped with a gradient fill (Cyan to Electric Blue). On hover, apply a neon pulse animation.
- **Ghost:** Transparent background with a thin Cyan border. Text is Celestial Silver.
- **Icon Buttons:** Nested in a circular translucent wrapper that expands slightly on hover.

### Cards
- Use the "Double-Bezel" architecture: an outer structural frame with thin padding and an inner content vessel with heavy background blur and inner-edge highlights.

### Data Tables
- Sticky headers with 90% opacity glass blurs.
- Rows separated by 1px borders at 5% opacity. 
- Highlight rows on hover with a 5% white overlay to maintain visibility in the dark theme.

### Interactive Map
- Landmasses in dark translucent blue.
- Network routes as glowing SVG paths with animated "data pulses" moving along the lines.
- Node markers should pulse with the color of their market status (Green/Amber/Red).

### Progress Bars
- Use a thin translucent track. The fill should be a horizontal gradient with a high-intensity "glow cap" at the leading edge of the progress.

### Inputs
- Semi-translucent backgrounds (#0a0d14 at 60%). 
- On focus, the border transitions to a Cyan glow with a 20% opacity ring.