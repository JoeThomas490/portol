# Portol

A multi-modal portfolio site built with Astro, React, and Cloudflare Pages. Each "mode" has its own visual identity and animated transitions between them.

## Stack

- **Astro 5** — static-first framework with React islands
- **React 19** — interactive components (Three.js, galleries, etc.)
- **Tailwind CSS 4** — utility styling
- **Cloudflare R2** — image storage bucket (S3-compatible, no egress fees)
- **Cloudflare Pages** — hosting with global CDN
- **Three.js** — 3D/WebGL interactive pieces

## Getting Started

```bash
# Requires Node 22+ (use fnm for per-project version switching)
fnm use

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

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
scripts/               # Helper scripts (R2 upload, etc.)
```

## Modes

Each mode is a separate route with its own layout, colour scheme, and typography:

- **Photography** (`/photography`) — white/light theme, serif-adjacent, gallery-focused
- **Programming** (`/programming`) — black/dark theme, monospace headings, project cards + interactive Three.js hero

Switching between modes triggers an animated view transition (directional colour sweep).

## Adding Content

### Photography (R2 + markdown)

1. Upload your image to R2 (using the helper script or wrangler directly):
   ```bash
   ./scripts/upload-photo.sh ~/photos/my-photo.jpg "My Photo Title"
   ```
2. Edit the generated markdown file in `src/content/photography/` to add caption, camera info, etc.
3. Commit and push — Cloudflare Pages rebuilds automatically.

Or manually: create a `.md` file in `src/content/photography/`:

```markdown
---
title: "Golden Hour"
alt: "Sunset over rolling hills"
src: "https://media.your-domain.com/photography/golden-hour.jpg"
caption: "Taken during an evening walk"
camera: "Sony A7III"
lens: "35mm f/1.4"
date: 2026-05-15
order: 1
---
```

### Programming (via markdown)

Add a `.md` file to `src/content/programming/`:

```markdown
---
title: "My Project"
description: "What it does"
tags: ["typescript", "react"]
repo: "https://github.com/..."
date: 2026-01-01
featured: true
---
```

## Adding New Modes

1. Create `src/layouts/XxxLayout.astro` extending `BaseLayout`
2. Create `src/pages/xxx/index.astro`
3. Add theme tokens in `src/styles/modes/xxx.css`
4. Add transition animations in `src/styles/transitions.css`
5. Update `ModeToggle.tsx` to include the new mode
