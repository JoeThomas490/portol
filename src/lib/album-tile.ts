import { publicUrlFor, thumbnailKeyFor, tilePhotoOf } from "./photo-keys";

export type AlbumTile = { src: string; alt: string };

/**
 * The image an Album Tile shows: the Thumbnail of its Tile Photo.
 * `photos` must be in filename order; null if the Album has none.
 */
export function albumTile(
  photos: { key: string; alt: string }[],
  publicUrl: string,
): AlbumTile | null {
  const photo = tilePhotoOf(photos);
  if (!photo) return null;
  return {
    src: publicUrlFor(publicUrl, thumbnailKeyFor(photo.key)),
    alt: photo.alt,
  };
}
