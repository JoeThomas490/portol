import {
  compareFilenames,
  filenameOf,
  isImageKey,
  THUMBNAIL_LONG_EDGE,
  thumbnailKeyFor,
  tilePhotoOf,
} from "../../lib/photo-keys";

export type Original = { key: string; etag: string };

export type ThumbnailUpload = {
  key: string;
  body: Uint8Array;
  metadata: Record<string, string>;
  cacheControl: string;
  contentType: string;
};

export interface PhotoStorage {
  listOriginals(prefix: string): Promise<Original[]>;
  readOriginal(key: string): Promise<Uint8Array>;
  /** Metadata of the Thumbnail at `key`, or null if there is none. */
  readThumbnailMetadata(key: string): Promise<Record<string, string> | null>;
  uploadThumbnail(thumbnail: ThumbnailUpload): Promise<void>;
}

export interface Resizer {
  /** Encodes `input` as WebP, scaled so its long edge is `longEdge` px. */
  toWebp(input: Uint8Array, longEdge: number): Promise<Uint8Array>;
}

const SOURCE_ETAG = "source-etag";
const CACHE_CONTROL = "public, max-age=86400";

export type Album = { prefix: string; photos: Original[] };

/**
 * Decides which Photos get Thumbnails: currently each Album Tile's
 * Photo. Widen this to give more Photos one.
 */
export function selectPhotosForThumbnails(albums: Album[]): Original[] {
  return albums.flatMap((album) => tilePhotoOf(album.photos) ?? []);
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

/** Uploads missing or stale Thumbnails; returns the keys uploaded. */
export async function createThumbnails({
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
  for (const original of selectPhotosForThumbnails(albums)) {
    const key = thumbnailKeyFor(original.key);
    const existing = await storage.readThumbnailMetadata(key);
    if (existing?.[SOURCE_ETAG] === original.etag) continue;

    const body = await resizer.toWebp(
      await storage.readOriginal(original.key),
      THUMBNAIL_LONG_EDGE,
    );
    await storage.uploadThumbnail({
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
