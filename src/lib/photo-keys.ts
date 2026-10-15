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
