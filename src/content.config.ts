import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    // Group posts into a multi-part series, e.g. "data-architecture"
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    // Optional social-share image placed in /public (e.g. /og/my-post.png)
    ogImage: z.string().optional(),
  }),
});

export const collections = { blog };
