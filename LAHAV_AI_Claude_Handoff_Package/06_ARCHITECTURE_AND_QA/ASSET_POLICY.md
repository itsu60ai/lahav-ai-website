# Asset Policy

## Production assets

Use only the canonical brand assets in `02_BRAND/` for the LAHAV AI identity.

## Stitch assets

The final Stitch HTML contains some remote `lh3.googleusercontent.com` image URLs. Treat them as **reference-only**. Do not make production depend on temporary/external Stitch-hosted URLs.

For production:
- rebuild appropriate visuals with HTML/CSS/SVG/canvas or local optimized image assets; or
- replace with approved locally-owned assets;
- preserve the conceptual composition, then upgrade it according to the Visual Upgrade Brief.

The `stitch-reference.png` screenshot in each page folder is the visual checkpoint if remote image URLs stop working.

Do not ship font files from this package. Use an approved web-font delivery method or project-native setup.
