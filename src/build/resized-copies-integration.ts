import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { AstroIntegration } from "astro";
import yaml from "js-yaml";
import { loadEnv } from "vite";
import { normalizePrefix } from "../lib/photo-keys";
import { createR2Storage, r2CredentialsFromEnv } from "./r2-storage";
import { createResizedCopies } from "./resized-copies";
import { sharpResizer } from "./sharp-resizer";

const ALBUMS_DIR = "src/content/photography";

/** Reads each Album's R2 prefix from the photography content collection. */
async function readAlbumPrefixes(root: string): Promise<string[]> {
  const dir = path.join(root, ALBUMS_DIR);
  const files = (await readdir(dir)).filter((file) => file.endsWith(".md"));

  return Promise.all(
    files.map(async (file) => {
      const source = await readFile(path.join(dir, file), "utf8");
      const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
      const data = frontmatter ? yaml.load(frontmatter) : undefined;
      const prefix = (data as { prefix?: unknown } | undefined)?.prefix;
      if (typeof prefix !== "string") {
        throw new Error(`${ALBUMS_DIR}/${file} has no prefix`);
      }
      return normalizePrefix(prefix);
    }),
  );
}

/**
 * Before pages render, makes sure each Album Tile's Photo has an
 * up-to-date resized copy in R2. See docs/adr/0001.
 */
export function resizedCopies(): AstroIntegration {
  return {
    name: "resized-copies",
    hooks: {
      "astro:build:start": async ({ logger }) => {
        const root = process.cwd();
        const env = { ...loadEnv("production", root, ""), ...process.env };
        const credentials = r2CredentialsFromEnv(env);
        if (!credentials) {
          logger.warn("R2 credentials missing; skipping resized copies.");
          return;
        }

        const uploaded = await createResizedCopies({
          storage: createR2Storage(credentials),
          resizer: sharpResizer,
          albumPrefixes: await readAlbumPrefixes(root),
        });
        logger.info(`Uploaded ${uploaded.length} resized copies.`);
      },
    },
  };
}
