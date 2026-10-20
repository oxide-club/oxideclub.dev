import { z } from 'astro/zod';

export const challengeLanguageSchema = z
  .object({
    recommendedLanguage: z.string().trim().min(1).optional(),
    acceptedLanguages: z
      .array(z.string().trim().min(1))
      .min(1)
      .refine(
        (values) => new Set(values).size === values.length,
        'Accepted languages must be unique',
      )
      .optional(),
  })
  .refine(
    (data) =>
      !data.acceptedLanguages ||
      !data.recommendedLanguage ||
      data.acceptedLanguages.includes(data.recommendedLanguage),
    {
      message: 'Recommended language must be accepted',
      path: ['recommendedLanguage'],
    },
  );

/** @param {{acceptedLanguages?: string[], recommendedLanguage?: string}} data */
export function challengeLanguages(data) {
  return (
    data.acceptedLanguages ??
    (data.recommendedLanguage ? [data.recommendedLanguage] : [])
  );
}
