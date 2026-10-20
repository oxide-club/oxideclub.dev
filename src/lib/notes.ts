import { getCollection } from 'astro:content';

export async function publishedNotes() {
  return (await getCollection('notes'))
    .flatMap((note) => {
      if (note.data.draft) return [];
      if (!note.data.publishedAt)
        throw new Error(`Missing publication date: ${note.id}`);
      return [
        { ...note, data: { ...note.data, publishedAt: note.data.publishedAt } },
      ];
    })
    .sort(
      (a, b) =>
        b.data.publishedAt.getTime() - a.data.publishedAt.getTime() ||
        a.id.localeCompare(b.id),
    );
}

export function noteDate(date: Date) {
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}
