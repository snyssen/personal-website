// 1. Import utilities from `astro:content`
import { defineCollection, z } from 'astro:content';
// 2. Define your collection(s)
const blogCollection = defineCollection({
    type: 'content',
    schema: ({ image }) => z.object({
        title: z.string(),
        pubDate: z.date(),
        updatedDate: z.date().optional(),
        description: z.string(),
        image: z.object({
            src: image().refine((img) => img.width >= 720, {
                message: "Cover image must be at least 720 pixels wide!",
            }),
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