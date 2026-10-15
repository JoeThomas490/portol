import { compareFilenames, filenameOf, isImageKey } from "../lib/photo-keys";

export type Original = { key: string; etag: string };

export type CopyUpload = {
  key: string;
  body: Uint8Array;
  metadata: Record<string, string>;
  cacheControl: string;
  contentType: string;
};

export interface PhotoStorage {
  listOriginals(prefix: string): Promise<Original[]>;
  readOriginal(key: string): Promise<Uint8Array>;
  /** Metadata of the copy at `key`, or null if there is no copy. */
  readCopyMetadata(key: string): Promise<Record<string, string> | null>;
  uploadCopy(copy: CopyUpload): Promise<void>;
}

export interface Resizer {
  /** Encodes `input` as WebP, scaled so its long edge is `longEdge` px. */
  toWebp(input: Uint8Array, longEdge: number): Promise<Uint8Array>;
}

const LONG_EDGE = 480;
const SOURCE_ETAG = "source-etag";
const CACHE_CONTROL = "public, max-age=86400";

export function copyKeyFor(originalKey: string): string {
  return `thumbs/${LONG_EDGE}/${originalKey.replace(/\.[^./]+$/, "")}.webp`;
}

export type Album = { prefix: string; photos: Original[] };

/**
 * Decides which Photos get resized copies: currently each Album Tile's
 * Photo, the first Photo by filename. Widen this to copy more Photos.
 */
export function selectPhotosToCopy(albums: Album[]): Original[] {
  return albums.flatMap((album) => album.photos.slice(0, 1));
}

async function listAlbum(
  storage: PhotoStorage,
  prefix: string,
): Promise<Album> {
  const photos = (await storage.listOriginals(prefix))
    .filter((original) => isImageKey(original.key))
    .sort((a, b) => compareFilenames(filenameOf(a.key), filenameOf(b.key)));
  return { prefix, photos };
}

/** Uploads missing or stale resized copies; returns the keys uploaded. */
export async function createResizedCopies({
  storage,
  resizer,
  albumPrefixes,
}: {
  /** Null when R2 credentials are missing (local development). */
  storage: PhotoStorage | null;
  resizer: Resizer;
  albumPrefixes: string[];
}): Promise<string[]> {
  if (!storage) return [];

  const albums = await Promise.all(
    albumPrefixes.map((prefix) => listAlbum(storage, prefix)),
  );

  const uploaded: string[] = [];
  for (const original of selectPhotosToCopy(albums)) {
    const key = copyKeyFor(original.key);
    const existing = await storage.readCopyMetadata(key);
    if (existing?.[SOURCE_ETAG] === original.etag) continue;

    const body = await resizer.toWebp(
      await storage.readOriginal(original.key),
      LONG_EDGE,
    );
    await storage.uploadCopy({
      key,
      body,
      metadata: { [SOURCE_ETAG]: original.etag },
      cacheControl: CACHE_CONTROL,
      contentType: "image/webp",
    });
    uploaded.push(key);
  }
  return uploaded;
}
