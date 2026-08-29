# LAHAV AI Website

Production website for LAHAV AI — an AI and software agency for Israeli small and medium
businesses. Hebrew-first, native RTL.

## Status
Stage 5 of an 11-stage build process (see `docs/` for the full paper trail: requirements,
priorities, PRD, design brief, source-of-truth reconciliation, and the architecture review).

## Stack
- [Astro](https://astro.build) (static output)
- Tailwind CSS v4
- Self-hosted Heebo + Assistant via `@fontsource-variable`

## Development
```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # outputs to dist/
```

The internal design-system review page lives at `/system/` (not linked from the public
site, marked `noindex`).

## Documentation
See `docs/SOURCE_OF_TRUTH.md` for the current authoritative source order, `docs/ARCHITECTURE_REVIEW.md`
for the technical plan, and `docs/PARKING_LOT.md` for deferred items with their triggers.
