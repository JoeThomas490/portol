# Thumbnails are generated at build time, not by Cloudflare

Album Tiles were loading full-resolution originals (1–3 MB each), so we need Thumbnails of Photos. We generate them in a build step with `sharp` and upload them to R2 next to the originals, rather than using Cloudflare Image Transformations on the asset domain. This keeps the site from depending on a Cloudflare-specific runtime feature and its usage quota, and we accept the cost of a longer build and a pipeline we have to maintain.

## Considered Options

- **Cloudflare Image Transformations** (`/cdn-cgi/image/...` URLs): no pipeline and automatic format negotiation, but it ties image delivery to a Cloudflare zone feature and its monthly transform limit.
- **Astro `<Image>` on remote URLs**: would download every original (hundreds of MB) on every build, with no reuse between deploys.

## Consequences

Only each Album Tile's Photo gets a Thumbnail for now. Which Photos get Thumbnails is chosen in one place in the build step, so it can be widened later (for example, if the Photography grid is redesigned) without changing the pipeline.

Each Thumbnail records the ETag of the original it was made from, so replacing an original under the same filename regenerates its Thumbnail on the next build.
