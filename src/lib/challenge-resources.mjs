import { z } from 'astro/zod';
import { github, githubUrl } from '../config/github.mjs';
import { challengeIdentifier } from './challenge-source.mjs';

export const languageLabels = { c: 'C', rust: 'Rust', cpp: 'C++' };
const languages = /** @type {Array<keyof typeof languageLabels>} */ (
  Object.keys(languageLabels)
);
export const githubResourcesSchema = z.object({
  challenge: z.boolean().default(false),
  solutions: z
    .array(z.enum(languages))
    .default([])
    .refine(
      (values) => new Set(values).size === values.length,
      'Implementation languages must be unique',
    ),
  community: z.boolean().default(false),
});

/**
 * @param {string} challengeId
 * @param {import('astro/zod').z.input<typeof githubResourcesSchema>} [metadata]
 */
export function challengeResources(challengeId, metadata) {
  if (!challengeIdentifier.test(challengeId))
    throw new Error('Invalid challenge identifier');
  const resources = githubResourcesSchema.parse(metadata ?? {});
  return {
    ...(resources.challenge && {
      challenge: githubUrl('challenges', challengeId),
    }),
    solutions: resources.solutions.map((language) => ({
      language,
      label: languageLabels[language],
      url: githubUrl('solutions', `${challengeId}/${language}`),
    })),
    ...(resources.community && {
      community: `${githubUrl('solutions', github.communityIndex, 'blob')}#${challengeId}`,
    }),
  };
}
