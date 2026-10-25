import { getCollection } from 'astro:content';
import { validateLabRelations } from './lab-structure.mjs';
import { activeLabs } from './lab-catalogue.mjs';

// Public historical entries still own their pages, assets and downloads.
export async function availableLabs() {
  const labs = (await getCollection('labs'))
    .filter((lab) => !lab.data.draft)
    .sort((a, b) => a.id.localeCompare(b.id));
  validateLabRelations(labs, await getCollection('challenges'));
  return labs;
}

export async function publishedLabs() {
  return activeLabs(await availableLabs());
}
