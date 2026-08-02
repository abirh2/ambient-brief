import { z } from 'zod';
import { NEWS_CATEGORIES } from './model.ts';

const HttpUrlSchema = z.string().url().refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === 'http:' || protocol === 'https:';
}, 'Only HTTP and HTTPS URLs are allowed');

export const NewsCategorySchema = z.enum(NEWS_CATEGORIES);

export const HeadlineSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1).optional(),
  publisher: z.string().min(1),
  publisherDomain: z.string().min(1),
  publishedAt: z.iso.datetime(),
  url: HttpUrlSchema,
  imageUrl: HttpUrlSchema.optional(),
  categories: z.array(NewsCategorySchema).min(1),
}).strict();

const categoriesShape = Object.fromEntries(
  NEWS_CATEGORIES.map((category) => [category, z.array(HeadlineSchema)]),
) as Record<(typeof NEWS_CATEGORIES)[number], z.ZodArray<typeof HeadlineSchema>>;

export const GeneratedNewsFeedSchema = z.object({
  schemaVersion: z.literal(1),
  provider: z.literal('currents'),
  generatedAt: z.iso.datetime(),
  sourceFetchedAt: z.iso.datetime(),
  status: z.enum(['success', 'partial']),
  categories: z.object(categoriesShape).strict(),
  metadata: z.object({
    requestCount: z.number().int().min(1).max(5),
    successfulRequests: z.number().int().min(1).max(5),
    failedRequests: z.number().int().min(0).max(5),
    articleCountBeforeDeduplication: z.number().int().min(0),
    articleCountAfterDeduplication: z.number().int().min(0),
  }).strict(),
}).strict().superRefine((feed, context) => {
  if (feed.metadata.successfulRequests + feed.metadata.failedRequests !== feed.metadata.requestCount) {
    context.addIssue({ code: 'custom', path: ['metadata'], message: 'Request counts must balance' });
  }
  if (feed.status === 'success' && feed.metadata.failedRequests !== 0) {
    context.addIssue({ code: 'custom', path: ['status'], message: 'A successful feed cannot contain failed requests' });
  }
});

export type GeneratedNewsFeed = z.infer<typeof GeneratedNewsFeedSchema>;
export type GeneratedHeadline = z.infer<typeof HeadlineSchema>;
