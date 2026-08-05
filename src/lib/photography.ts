import { getCollection } from "astro:content";
import { listR2Images } from "./r2";

export type PhotoCollection = {
  slug?: string;
  name: string;
  date?: Date;
  featured: boolean;
  photos: {
    src: string;
    alt: string;
    title: string;
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
          src: image.src,
          alt: entry.data.alt ?? image.alt,
          title: entry.data.title || image.alt,
        })),
      };
    }),
  );

  return collections
    .filter((collection) => collection.photos.length > 0)
    .sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return -1;
      if (!b.date) return 1;
      return b.date.getTime() - a.date.getTime();
    });
}
