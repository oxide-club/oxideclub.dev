import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { existsSync } from 'node:fs';
import { challengeTaxonomySchema } from './lib/challenge-taxonomy.mjs';
import { challengeId, challengeIdentifier } from './lib/challenge-source.mjs';
if (!existsSync('.content/challenges')) {
  throw new Error(
    'Challenge content is missing. Run npm run content:sync first.',
  );
}
const discordUrl = z.url().refine((value) => {
  const url = new URL(value);
  return (
    url.protocol === 'https:' &&
    url.hostname === 'discord.com' &&
    !url.username &&
    !url.password
  );
}, 'Use a real HTTPS Discord permalink');
const challenges = defineCollection({
  loader: glob({
    pattern: '*/index.md',
    base: './.content/challenges',
    generateId: challengeId,
  }),
  schema: challengeTaxonomySchema.extend({
    title: z.string().min(1),
    slug: z.string().regex(challengeIdentifier),
    summary: z.string().min(1),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    draft: z.boolean(),
    participation: z.enum(['flagship', 'open']),
    recommendedLanguage: z.string().min(1).optional(),
    topics: z.array(z.string()).min(1),
    featured: z.boolean().default(false),
    discordThreadUrl: discordUrl.optional(),
    eventUrl: discordUrl.optional(),
    referenceUrl: z.url().optional(),
    environment: z.string().min(1).optional(),
  }),
});
const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    summary: z.string().min(1),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    draft: z.boolean(),
    featured: z.boolean().default(false),
    authors: z.array(z.string().min(1)).min(1).optional(),
  }),
});
export const collections = { challenges, notes };
