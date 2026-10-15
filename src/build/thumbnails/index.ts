import type { AstroIntegration } from "astro";
import { loadEnv } from "vite";
import { readAlbumPrefixes } from "./album-prefixes";
import { createThumbnails } from "./create-thumbnails";
import { createR2Storage, r2CredentialsFromEnv } from "./r2-storage";
import { sharpResizer } from "./sharp-resizer";

/**
 * Before pages render, makes sure each Album Tile's Photo has an
 * up-to-date Thumbnail in R2. See docs/adr/0001-build-time-thumbnails.md.
 */
export function thumbnails(): AstroIntegration {
  return {
    name: "thumbnails",
    hooks: {
      "astro:build:start": async ({ logger }) => {
        const root = process.cwd();
        const env = { ...loadEnv("production", root, ""), ...process.env };
        const credentials = r2CredentialsFromEnv(env);
        if (!credentials) {
          logger.warn("R2 credentials missing; skipping Thumbnails.");
          return;
        }

        const uploaded = await createThumbnails({
          storage: createR2Storage(credentials),
          resizer: sharpResizer,
          albumPrefixes: await readAlbumPrefixes(root),
        });
        logger.info(`Uploaded ${uploaded.length} Thumbnails.`);
      },
    },
  };
}
