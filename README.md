# Portol

A portfolio site built with Astro, React, and Cloudflare Pages. Each section or 'Mode' of the portfolio is designed to be it's own contained site, with individual styling, components and design languages. This was a deliberate choice to best highlight each different aspect of my work.

## Stack

- **Astro 5** — static-first framework
- **React 19** — interactive components
- **Tailwind CSS 4** — utility styling
- **Cloudflare R2** — image storage bucket (S3-compatible, no egress fees)
- **Cloudflare Pages** — hosting with global CDN
- **Three.js** — 3D/WebGL interactive pieces

## Project Structure

```
src/
├── layouts/           # BaseLayout + per-mode layouts
├── pages/
│   ├── index.astro    # Landing / mode selector
│   ├── photography/   # Photography mode (white/light)
│   └── programming/   # Programming mode (black/dark)
├── components/        # React islands (Three.js, interactive pieces)
├── styles/
│   ├── global.css
│   ├── transitions.css
│   └── modes/         # Per-mode CSS custom properties
├── content/           # Astro content collections (markdown)
└── lib/               # Utilities
scripts/               # Helper scripts
```

## Modes

Each mode is a separate route with its own layout, colour scheme, and typography:

- **Photography** (`/photography`)
- **Programming** (`/programming`)
