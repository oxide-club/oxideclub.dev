import { z } from 'astro/zod';
import { resolve, isAbsolute } from 'node:path';

export const noteIdentifier = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const reservedNoteDirectories = new Set([
  'templates',
  'docs',
  'scripts',
  'tests',
]);

export function notesDirectory() {
  if (process.env.NOTES_SOURCE && !isAbsolute(process.env.NOTES_SOURCE))
    throw new Error('NOTES_SOURCE must be an absolute path');
  if (
    process.env.NOTES_SOURCE &&
    ((process.env.CI && process.env.CI !== 'false') ||
      process.env.SITE_RELEASE === 'production')
  ) {
    throw new Error(
      'NOTES_SOURCE is for local previews only; production and CI must fetch the public notes repository.',
    );
  }
  return resolve(process.env.NOTES_SOURCE || '.content/notes');
}

/** @param {{entry: string, data: Record<string, unknown>}} input */
export function noteId({ entry, data }) {
  const [id, filename, extra] = entry.split('/');
  if (
    !noteIdentifier.test(id) ||
    reservedNoteDirectories.has(id) ||
    filename !== 'index.md' ||
    extra
  ) {
    throw new Error(
      `Invalid note directory: ${entry}; use <kebab-case-id>/index.md`,
    );
  }
  if (data.slug !== undefined)
    throw new Error(
      `Remove redundant slug metadata from ${entry}; the directory is the canonical identifier.`,
    );
  return id;
}

const calendarDate = z.union([z.date(), z.iso.date().pipe(z.coerce.date())]);

export const noteSchema = z
  .object({
    title: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    publishedAt: calendarDate.optional(),
    updatedAt: calendarDate.optional(),
    topics: z.array(z.string().trim().min(1)).default([]),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    authors: z.array(z.string().trim().min(1)).min(1).optional(),
  })
  .superRefine((data, context) => {
    if (!data.draft && !data.publishedAt) {
      context.addIssue({
        code: 'custom',
        path: ['publishedAt'],
        message:
          'Published notes require publishedAt; use draft: true while writing.',
      });
    }
  });
