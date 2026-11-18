import { defineCollection } from "astro/content/config";
import { glob } from "astro/loaders";
import { z } from "astro/zod";


/*
    001-pre-page-1
    002-pre-page-2
    003-pre-page-3
    100-part-1
    101-part-1-chapter-1
    102-part-1-chapter-2
    103-part-1-chapter-3
    200-part-2
    201-part-2-chapter-4
    202-part-2-chapter-5
    203-part-2-chapter-6
    300-part-3
    301-part-3-chapter-7
    302-part-3-chapter-8
    303-part-3-chapter-9
*/

const units = defineCollection({
    loader: glob({ base: "./src/content/book", pattern: "*.{md,mdx}" }),
    schema: z.object({
        // structure
        index: z.string().min(1), // 000, 003, 101, 204
        type: z.enum(["PAGE", "CHAPTER", "PART"]),
        
        // metadata
        title: z.string(), 
        isDraft: z.boolean(),
        
        // chapter number
        chapterNum: z.number().optional(),

        // part that chapter belongs to
        partNum: z.number().optional(), // 1, 2, 3, 4

        // part-only
        // ...
    })
});

const blogs = defineCollection({
    loader: glob({ base: "./src/content/blog", pattern: "*.{md,mdx}" }),
    schema: z.object({
        // metadata
        title: z.string(), 
        description: z.string(),
        author: z.string(),
        
        category: z.string(), // top-level category; "Technology"
        tags: z.array(z.string()), // 
        
        datePublished: z.string(),
        dateModified: z.string(),

        isDraft: z.boolean(),

        // ...
    })
});

export const collections = { 
    'UNITS': units,
    'BLOGS': blogs,
};