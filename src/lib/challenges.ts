import { getCollection } from 'astro:content';
import { selectPublished } from './content.mjs';
export async function publishedChallenges() {
  return selectPublished(await getCollection('challenges'));
}
export { difficultyLabels } from './challenge-catalogue.mjs';
