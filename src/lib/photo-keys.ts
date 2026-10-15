const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif",
]);

export function normalizePrefix(prefix: string): string {
  return prefix.replace(/^\/+/, "").replace(/\/+$/, "");
}

export function filenameOf(key: string): string {
  return key.split("/").pop() ?? "";
}

export function isImageKey(key: string): boolean {
  const filename = filenameOf(key);
  if (!filename || filename.startsWith(".")) return false;

  const extension = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return IMAGE_EXTENSIONS.has(extension);
}

export function compareFilenames(a: string, b: string): number {
  return a.localeCompare(b, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export const THUMBNAIL_LONG_EDGE = 480;

/** Where a Photo's Thumbnail lives in R2: thumbs/480/<path>.webp. */
export function thumbnailKeyFor(originalKey: string): string {
  return `thumbs/${THUMBNAIL_LONG_EDGE}/${originalKey.replace(/\.[^./]+$/, "")}.webp`;
}

export function publicUrlFor(baseUrl: string, key: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${key}`;
}

/**
 * An Album Tile's Photo: the first by filename. Both the build step and the
 * grid choose it here, so the grid always shows a Thumbnail that was built.
 */
export function tilePhotoOf<T>(photosInFilenameOrder: T[]): T | undefined {
  return photosInFilenameOrder[0];
}
