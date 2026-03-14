// 1. Import utilities from `astro:content`
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
// 2. Define your collection(s)
const blogCollection = defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
    schema: ({ image }) => z.object({
        title: z.string(),
        pubDate: z.date(),
        updatedDate: z.date().optional(),
        description: z.string(),
        image: z.object({
            src: image(),
            alt: z.string()
        }),
        tags: z.array(z.object({
            name: z.string(),
            colorClass: z.string()
        }))
    })
});
// 3. Export a single `collections` object to register your collection(s)
//    This key should match your collection directory name in "src/content"
export const collections = {
    'blog': blogCollection,
};
