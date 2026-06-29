import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const programming = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/programming' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    url: z.string().url().optional(),
    repo: z.string().url().optional(),
    image: z.string().optional(),
    heroImage: z.string().url().optional(),
    role: z.string().optional(),
    studio: z.string().optional(),
    date: z.coerce.date(),
    dateRange: z.string().optional(),
    platform: z.string().optional(),
    tools: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});

const photography = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/photography' }),
  schema: z.object({
    title: z.string(),
    collection: z.string(),
    alt: z.string(),
    caption: z.string().optional(),
    src: z.string().url(),
    camera: z.string().optional(),
    lens: z.string().optional(),
    date: z.coerce.date().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(0),
  }),
});

export const collections = { programming, photography };
