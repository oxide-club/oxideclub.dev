import { getCollection } from 'astro:content';
import { selectPublished } from './content.mjs';

export async function publishedNotes() {
  return selectPublished(await getCollection('notes')).sort(
    (a, b) =>
      b.data.publishedAt.getTime() - a.data.publishedAt.getTime() ||
      a.data.slug.localeCompare(b.data.slug),
  );
}

export function noteDate(date: Date) {
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}
