import { z } from 'zod';

export const GdeltArticleSchema = z.object({
  title: z.string(),
  url: z.string(),
  domain: z.string().optional().default(''),
  seendate: z.string().optional(),
  socialimage: z.string().optional(),
});

export const GdeltResponseSchema = z.object({
  articles: z.array(GdeltArticleSchema).optional(),
  data: z.array(GdeltArticleSchema).optional(),
});

export type GdeltArticleResponse = z.infer<typeof GdeltArticleSchema>;
