import { z } from 'astro/zod';
import { resolve, isAbsolute } from 'node:path';
export const labIdentifier = /^\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function labsDirectory() {
  const source = process.env.LABS_SOURCE;
  if (
    source !== undefined &&
    ((process.env.CI && process.env.CI !== 'false') ||
      process.env.SITE_RELEASE === 'production')
  )
    throw new Error('LABS_SOURCE is forbidden in CI and production');
  if (source !== undefined && !isAbsolute(source))
    throw new Error('LABS_SOURCE must be an absolute path');
  return resolve(source ?? '.content/labs');
}
export function labId({ entry, data }) {
  const [id, file, extra] = entry.split('/');
  if (
    !labIdentifier.test(id) ||
    file !== 'index.md' ||
    extra ||
    data.slug !== id
  )
    throw new Error(`Invalid lab identifier or slug: ${entry}`);
  return id;
}
const text = z.string().trim().min(1);
const list = z.array(text).min(1);
const date = z.union([z.date(), z.iso.date().pipe(z.coerce.date())]);
export const labSchema = z
  .object({
    title: text
      .startsWith('Laboratório de ')
      .refine((v) => v.length > 'Laboratório de '.length),
    slug: z.string().regex(labIdentifier),
    summary: text,
    area: text,
    question: text,
    draft: z.boolean(),
    publishedAt: date.optional(),
    updatedAt: date.optional(),
    topics: list,
    prerequisites: list,
    tools: list,
    environment: text,
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    relatedChallenges: z.array(z.string().regex(labIdentifier)).default([]),
    relatedLabs: z.array(z.string().regex(labIdentifier)).default([]),
    discordThreadUrl: z
      .url()
      .refine((v) => {
        const u = new URL(v);
        return (
          u.protocol === 'https:' &&
          u.hostname === 'discord.com' &&
          !u.username &&
          !u.password
        );
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.draft && !data.publishedAt)
      ctx.addIssue({
        code: 'custom',
        path: ['publishedAt'],
        message: 'Published labs require publishedAt',
      });
  });
