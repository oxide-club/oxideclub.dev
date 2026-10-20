import { publishedChallenges } from './challenges';
import { publishedNotes } from './notes';

/** Common presentation data. Add adapters here when other collections ship. */
export interface Publication {
  title: string;
  summary: string;
  href: string;
  kind: string;
  featured: boolean;
}

export async function publishedContent(): Promise<Publication[]> {
  const [challenges, notes] = await Promise.all([
    publishedChallenges(),
    publishedNotes(),
  ]);
  return [
    ...challenges.map(({ data }) => ({
      title: data.title,
      summary: data.summary,
      href: `/desafios/${data.slug}`,
      kind: 'Desafio',
      featured: data.featured,
    })),
    ...notes.map(({ data }) => ({
      title: data.title,
      summary: data.summary,
      href: `/notas/${data.slug}`,
      kind: 'Nota técnica',
      featured: data.featured,
    })),
  ];
}
