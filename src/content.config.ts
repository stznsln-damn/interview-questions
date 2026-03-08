import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./questions" }),
  schema: z.object({
    title: z.string(),
    category: z.string(),
    order: z.number(),
  }),
});

export const collections = { posts };
