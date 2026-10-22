import { getCollection } from 'astro:content';
import { validateLabRelations } from './lab-structure.mjs';
export async function publishedLabs() {
  const labs = (await getCollection('labs'))
    .filter((lab) => !lab.data.draft)
    .sort((a, b) => a.id.localeCompare(b.id));
  validateLabRelations(labs, await getCollection('challenges'));
  return labs;
}
