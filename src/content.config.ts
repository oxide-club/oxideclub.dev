import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { existsSync } from 'node:fs';
import {
  notesDirectory,
  noteId,
  noteSchema,
  reservedNoteDirectories,
} from './lib/note-source.mjs';
import { githubResourcesSchema } from './lib/challenge-resources.mjs';
import { challengeLanguageSchema } from './lib/challenge-languages.mjs';
import { challengeTaxonomySchema } from './lib/challenge-taxonomy.mjs';
import {
  loadChallengeAreas,
  validateChallengeArea,
} from './lib/challenge-areas.mjs';
import {
  challengesDirectory,
  challengeId,
  challengeIdentifier,
} from './lib/challenge-source.mjs';
import {
  meetingsDirectory,
  meetingId,
  meetingSchema,
} from './lib/meeting-source.mjs';
if (!existsSync(challengesDirectory())) {
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
const challengeBase = challengesDirectory();
const challengeGlob = glob({
  pattern: '*/index.md',
  base: challengeBase,
  generateId: challengeId,
});
const challenges = defineCollection({
  loader: {
    name: 'challenge-definitions',
    async load(context) {
      // A preview source can change without the content config file changing.
      // Drop paths/digests from the previous source before loading the new one.
      if (context.meta.get('source') !== challengeBase) {
        context.store.clear();
        context.meta.set('source', challengeBase);
      }
      await challengeGlob.load(context);
      const areas = await loadChallengeAreas(challengeBase);
      for (const [id, entry] of context.store.entries()) {
        validateChallengeArea(entry.data.area, areas, id);
      }
    },
  },
  schema: challengeLanguageSchema.safeExtend({
    ...challengeTaxonomySchema.shape,
    title: z.string().min(1),
    slug: z.string().regex(challengeIdentifier),
    summary: z.string().min(1),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    draft: z.boolean(),
    participation: z.enum(['flagship', 'open']),
    cardTopics: z.array(z.string().min(1)).min(1).max(3).optional(),
    difficultyContext: z.string().min(1).optional(),
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
    pattern: [
      '*/index.md',
      ...[...reservedNoteDirectories].map((directory) => `!${directory}/**`),
    ],
    base: notesDirectory(),
    generateId: noteId,
  }),
  schema: noteSchema,
});
if (!existsSync(meetingsDirectory())) {
  throw new Error(
    'Meeting content is missing. Run npm run content:sync or set MEETINGS_SOURCE to a local meetings checkout.',
  );
}
const meetings = defineCollection({
  loader: glob({
    pattern: '*.md',
    base: `${meetingsDirectory()}/meetings`,
    generateId: meetingId,
  }),
  schema: meetingSchema,
});
export const collections = { challenges, notes, meetings };
