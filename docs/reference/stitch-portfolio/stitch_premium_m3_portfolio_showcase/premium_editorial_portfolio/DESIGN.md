---
name: Premium Editorial Portfolio
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#444748'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#86513b'
  on-secondary: '#ffffff'
  secondary-container: '#ffb99e'
  on-secondary-container: '#7a4732'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1c1b1a'
  on-tertiary-container: '#868382'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#ffdbce'
  secondary-fixed-dim: '#fcb69b'
  on-secondary-fixed: '#351002'
  on-secondary-fixed-variant: '#6a3a26'
  tertiary-fixed: '#e6e2df'
  tertiary-fixed-dim: '#cac6c4'
  on-tertiary-fixed: '#1c1b1a'
  on-tertiary-fixed-variant: '#484645'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
  deep-charcoal: '#2A2A2A'
  soft-clay: '#F6D8CC'
  paper-white: '#FDFDFD'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 84px
    fontWeight: '800'
    lineHeight: 92px
    letterSpacing: -0.04em
  display-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  body-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 32px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  label-caps:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
  nav-item:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  masonry-gap: 32px
  sidebar-width: 320px
---

## Brand & Style

This design system is built on the principles of **Modern Minimalism** and **High-Contrast Editorial** design. It is tailored for a premium portfolio experience that prioritizes content through intentional whitespace and a rigorous typographic hierarchy. The aesthetic is sophisticated and "Rock n' Roll" professional—balancing technical precision with creative flair.

The emotional response should be one of confidence and luxury. By using a monochromatic base punctuated by a muted metallic accent, the interface recedes to let the portfolio work take center stage. The style utilizes crisp edges mixed with subtly rounded corners to maintain a contemporary, approachable feel without sacrificing its high-end architectural roots.

## Colors

The palette is anchored in a high-contrast relationship between **Deep Black** (#181818) and **Crisp White** (#FFFFFF). This monochromatic foundation ensures that photography and case study assets provide the primary color for the experience.

- **Primary:** Used for headlines, heavy borders, and high-impact UI elements.
- **Secondary (Accent):** A muted metallic charcoal/clay hybrid used sparingly for interactive highlights, specialized labels, and subtle decorative motifs.
- **Neutral:** A pure white base for maximum clarity and "breathing room."
- **Functional Grays:** Reserved for tertiary information and input field borders to maintain a low-noise environment.

## Typography

The typography system uses a tri-font strategy to establish a "Tech-Agency" editorial vibe. 

1. **Headlines (Hanken Grotesk):** Sharp, contemporary, and bold. Used for page titles and project names to convey authority.
2. **Body (Inter):** Highly legible and neutral, providing a professional backbone for long-form case studies.
3. **Labels & Metadata (Space Mono):** A monospaced choice for technical data, categories, and navigation, adding a "Rock n' Roll" technical edge.

Generous leading (line height) is applied to body text to enhance the premium, readable feel. Display sizes use tight letter-spacing for a modern, compressed look in large-scale hero sections.

## Layout & Spacing

The layout is defined by a **12-column fixed-width grid** for desktop and a **fluid 4-column grid** for mobile.

- **Portfolio Grid:** Employs a **Masonry-style layout** to showcase diverse media aspect ratios. Elements should span varying column counts (e.g., 4, 6, or 8 columns) to create a rhythmic, non-linear flow.
- **Detail Pages:** Feature a **Sticky Sidebar** on the left (spanning 3 columns) for project metadata (services, year, client), while the right side (spanning 9 columns) scrolls freely with imagery and narrative.
- **Whitespace:** Spacing is intentional and generous. Sections are separated by large vertical buffers (120px - 160px) to ensure every project "breathes" and is viewed in isolation.

## Elevation & Depth

This system avoids heavy shadows and skeuomorphism. Depth is achieved through **Tonal Layers** and **Subtle Outlines**.

- **Surface Levels:** The primary background is white. Secondary surfaces (like cards or sidebars) may use a very light gray (#FDFDFD) or a thin 1px border (#181818 at 10% opacity) to define boundaries.
- **Interactive Elevation:** Buttons and cards use a "Lift" effect on hover—moving 4px upward with a very soft, diffused shadow (0px 10px 30px rgba(0,0,0,0.05)).
- **Sticky Elements:** Sidebars and navigation headers use a frosted backdrop filter (blur: 12px) if overlapping content, but generally remain flat against the canvas to maintain the minimal aesthetic.

## Shapes

The shape language is "Soft-Modern." While the overall grid is rigid and architectural, individual components use a consistent **0.25rem (4px)** radius. This subtle rounding softens the high-contrast "brutalism" of the black-and-white palette, making the interface feel premium and contemporary rather than harsh. 

Images within the masonry grid should strictly follow this corner radius to maintain a unified visual language.

## Components

### Buttons
- **Primary:** Solid black fill, white uppercase text (Hanken Grotesk), minimal rounding. Hover state shifts to the secondary accent color or a 90% opacity.
- **Ghost:** Thin 1px black border, transparent background, black text. Use for secondary actions like "Load More."

### Cards (Masonry)
- No visible borders by default.
- Information (Title/Category) is hidden and revealed on hover, or placed directly below the image using `label-caps` for the category.
- Aspect ratios are preserved to support the masonry effect.

### Input Fields
- Underline style (bottom border only) for a minimal, editorial look.
- Label floats or sits above in `label-caps`.
- Focus state thickens the bottom border to 2px.

### Sticky Sidebar
- Positioned on the left for project detail pages.
- Contains technical metadata using `label-caps` for headers and `body-md` for content.
- Vertical dividers (1px, light gray) separate key data points.

### Chips/Tags
- Small, uppercase monospaced text.
- Light gray background (#F6D8CC at 20% opacity) with no border. Used for categorizing expertise like "AI SOLUTIONS" or "E-COMMERCE."