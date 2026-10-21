import { z } from 'astro/zod';

export const categoryLabels = {
  build: 'Construir',
  investigate: 'Investigar',
  debug: 'Depurar',
  optimize: 'Otimizar',
  experiment: 'Experimentar',
};

export const challengeTaxonomySchema = z.object({
  area: z.string().min(1),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  categories: z
    .array(z.enum(['build', 'investigate', 'debug', 'optimize', 'experiment']))
    .min(1)
    .refine(
      (categories) => new Set(categories).size === categories.length,
      'Challenge categories must be unique',
    ),
});
