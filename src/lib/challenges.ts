import { getCollection } from 'astro:content';
import { selectPublished } from './content.mjs';
export async function publishedChallenges() {
  return selectPublished(await getCollection('challenges'));
}
export const difficultyLabels = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};
