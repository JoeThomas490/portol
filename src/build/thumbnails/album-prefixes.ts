import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { normalizePrefix } from "../../lib/photo-keys";

const ALBUMS_DIR = "src/content/photography";

/** Reads each Album's R2 prefix from the photography content collection. */
export async function readAlbumPrefixes(root: string): Promise<string[]> {
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
