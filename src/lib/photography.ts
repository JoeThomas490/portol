import { getCollection } from "astro:content";
import { R2_PUBLIC_URL } from "astro:env/server";
import { albumTile, type AlbumTile } from "./album-tile";
import { listR2Images } from "./r2";

export type PhotoCollection = {
  slug?: string;
  name: string;
  date?: Date;
  featured: boolean;
  /** The Thumbnail shown on this Album's Tile in the grid. */
  tile: AlbumTile;
  photos: {
    key: string;
    src: string;
    alt: string;
  }[];
};

export async function getPhotoCollections(): Promise<PhotoCollection[]> {
  const entries = await getCollection("photography");

  const collections = await Promise.all(
    entries.map(async (entry) => {
      const images = await listR2Images(entry.data.prefix);

      return {
        slug: entry.id,
        name: entry.data.collection,
        date: entry.data.date,
        featured: entry.data.featured,
        photos: images.map((image) => ({
          key: image.key,
          src: image.src,
          alt: entry.data.alt ?? image.alt,
        })),
      };
    }),
  );

  return collections
    .flatMap((collection) => {
      const tile = albumTile(collection.photos, R2_PUBLIC_URL);
      return tile ? [{ ...collection, tile }] : [];
    })
    .sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return -1;
      if (!b.date) return 1;
      return b.date.getTime() - a.date.getTime();
    });
}
