import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { existsSync } from 'node:fs';
import { notesDirectory, noteId, noteSchema } from './lib/note-source.mjs';
import { githubResourcesSchema } from './lib/challenge-resources.mjs';
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
    github: githubResourcesSchema.optional(),
    environment: z.string().min(1).optional(),
  }),
});
if (!existsSync(notesDirectory())) {
  throw new Error(
    'Note content is missing. Run npm run content:sync or set NOTES_SOURCE to a local notes checkout.',
  );
}
const notes = defineCollection({
  loader: glob({
    pattern: ['*/index.md', '!templates/**', '!docs/**'],
    base: notesDirectory(),
    generateId: noteId,
  }),
  schema: noteSchema,
});
export const collections = { challenges, notes };
