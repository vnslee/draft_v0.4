---
name: Supanova Global Diagnostic
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#434655'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#575d78'
  on-secondary: '#ffffff'
  secondary-container: '#d8defe'
  on-secondary-container: '#5b617d'
  tertiary: '#006242'
  on-tertiary: '#ffffff'
  tertiary-container: '#007d55'
  on-tertiary-container: '#bdffdb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#dce1ff'
  secondary-fixed-dim: '#bfc5e4'
  on-secondary-fixed: '#141a32'
  on-secondary-fixed-variant: '#3f465f'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Satoshi
    fontSize: 44px
    fontWeight: '800'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Pretendard
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  stat-lg:
    fontFamily: Satoshi
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  body-base:
    fontFamily: Pretendard
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: '0'
  body-bold:
    fontFamily: Pretendard
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: '0'
  label-caps:
    fontFamily: Satoshi
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.15em
  headline-md-mobile:
    fontFamily: Pretendard
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  stat-lg-mobile:
    fontFamily: Satoshi
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
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
  xxl: 48px
  section-md: 96px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

The visual personality of the design system is **analytical, prestigious, and technologically advanced**. It is engineered for enterprise-level B2B diagnostics, where data density must coexist with executive-level clarity. The system avoids generic corporate tropes in favor of a **Modern Structural** aesthetic that blends high-fidelity minimalism with tactile, hardware-inspired depth.

The UI evokes an emotional response of absolute trust and precision—mimicking the feel of a high-end financial terminal or a technical diagnostic lab. Key characteristics include:
- **Precision Engineering:** Sharp lines, razor-thin borders, and meticulous alignment grids.
- **Atmospheric Depth:** Strategic use of "Abyss Ink" canvases and radial light orbs to create a sense of infinite spatial scale.
- **Tactile Materiality:** Elements feel like physical objects through the use of "double-bezel" architectures and micro-shadows that simulate physical mass.
- **Analytical Clarity:** A primary focus on numerical hierarchy and bilingual (Korean/English) readability.

## Colors

The palette is anchored by **Stellar Cobalt Blue** and **Abyss Ink**, establishing a professional, high-trust environment. The system utilizes a functional color strategy where vibrancy is reserved for data signals and interactive triggers.

- **Primary Canvas:** Light mode utilizes **Crystalline Pure White** (#F8FAFC) for an editorial feel, while dark mode shifts to the deep, navy-undertoned **Abyss Ink** (#0A1128).
- **Surface Strategy:** Surfaces are layered using **Supanova Pearl Gray** for secondary structure and **Oceanic Deep Blue** for dark-mode containers.
- **Interactive Accents:** **Stellar Cobalt Blue** is the sole interactive color, used for primary CTAs and active states. It must never exceed 80% saturation to maintain an enterprise-grade aesthetic.
- **Functional Semantics:** Data indicators use a "Surgical" palette—Emerald for compliance, Amber for caution, and Crimson for high-barrier risks.

## Typography

The typography system is optimized for bilingual (Korean and English) data density. It pairs the geometric precision of **Satoshi** (for numbers and labels) with the exceptional readability of **Pretendard** (for body and UI text).

**Implementation Rules:**
- **Korean Word-Breaks:** Apply `break-keep-all` to all Korean text containers to prevent mid-word line breaks.
- **Numerical Alignment:** Use `tabular-nums` for all table data, percentages, and trade tariff lists to ensure vertical alignment across rows.
- **Hierarchy:** Use **Caps Micro-Labels** as eyebrows to provide structural context above main headings.
- **Line Length:** Maintain a maximum width of `65ch` for body copy to ensure comfortable market report reading.

## Layout & Spacing

The layout philosophy follows an **Asymmetrical Bento Grid** model, allowing for high data density without feeling cluttered. It prioritizes information hierarchy by varying container spans based on diagnostic importance.

- **Grid Model:** A 12-column fluid grid system with 24px gutters and 48px desktop margins. 
- **Bento Spans:** Analytical blocks should utilize `col-span-8` for primary visualizations (like maps) and `col-span-4` for secondary metrics.
- **Z-Axis Cascade:** For multi-step diagnostics, use a slight Z-axis overlap with subtle 0.5-degree rotations to create a stacked "dossier" feel.
- **Responsive Reflow:** Dashboard grids collapse to a single column on mobile (<768px). Remove custom rotations and negative margins on mobile to maintain stability.

## Elevation & Depth

Visual hierarchy is established through a combination of **Tonal Layering** and **Physical Bezeling** rather than traditional soft shadows.

- **Double-Bezel Architecture:** Containers feature an outer wrapper with a low-opacity fill (`bg-black/5` or `bg-white/5`) and a 1px ring, housing an inner core with a solid background and an inner highlight (`shadow-[inset_0_1px_1px]`). This creates a "machined hardware" appearance.
- **Glassmorphism:** Navigation and dropdowns use `backdrop-blur-xl` combined with semi-transparent surfaces to float above the diagnostic content.
- **Interactive State:** Hover states utilize a spring-physics transform (`cubic-bezier(0.16, 1, 0.3, 1)`) and a subtle scale increase to simulate physical responsiveness.

## Shapes

The shape language is defined by **Complex Radii**. While the base unit is rounded (8px), the design system uses nested radius math to maintain visual harmony within the "double-bezel" containers.

- **Base Components:** Buttons and chips use `rounded-full` (pill-shaped) to provide a soft, modern contrast to the rigid grid.
- **Container Radius:** Outer wrappers use a generous `rounded-[2rem]` (32px), while inner core containers use a calculated `rounded-[calc(2rem-0.375rem)]` to ensure the corner curves appear perfectly concentric.
- **Input Fields:** Use `rounded-lg` (8px) for a more structured, functional feel.

## Components

### Buttons
Primary buttons are styled as high-precision pills. They must include an icon nested in an offset circular wrapper (e.g., a dark circle inside a blue button) to signify physical forward motion. Transition speed is set to 0.5s using a custom cubic-bezier for a "weighty" feel.

### Sophisticated Cards
Cards follow the Double-Bezel architecture. They are not just boxes but "trays" for data. Use high-contrast Satoshi display figures for the primary metric inside the card, with Muted Steel text for descriptions.

### Sleek Progress Bars
The track is a dual-bezel recessed line. The progress fill must be high-contrast (Emerald, Amber, or Cobalt) and include a micro-shimmer animation to indicate active diagnostic calculation.

### Interactive World Map Markers
Markers are glowing status orbs with a dual-layered pulse animation (`mapPulse`). Hovering a marker reveals a glassmorphic popover that previews regional tariffs and market scores using a double-bezel card structure.

### Polished Dropdowns
Dropdown triggers are pill-shaped with a 52px height. The dropdown menu itself uses absolute glassmorphism with a 1px ring border and a soft ambient shadow for maximum depth.

### Checkboxes & Radio Buttons
These should feel like physical toggles. Use high-contrast active states (Stellar Cobalt Blue) with white inner checks or pips. Avoid generic browser styling.