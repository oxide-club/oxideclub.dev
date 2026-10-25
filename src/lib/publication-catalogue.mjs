import { difficultyLabels } from './challenge-catalogue.mjs';
import { labUrl } from './lab-urls.mjs';

/**
 * @typedef {{key: string, title: string, summary: string, href: string,
 * kind: string, action: string, publishedAt: Date, topics: string[],
 * difficulty?: string}} Publication
 * @typedef {{id: string, data: {title: string, summary: string, draft: boolean,
 * publishedAt?: Date, slug?: string, topics?: string[], cardTopics?: string[],
 * difficulty?: 'beginner' | 'intermediate' | 'advanced'}}} Entry
 */

/** @param {{labs?: Entry[], challenges?: Entry[], notes?: Entry[]}} collections
 * @returns {Publication[]} */
export function buildPublications({ labs = [], challenges = [], notes = [] }) {
  /** @type {Publication[]} */
  const publications = [];
  const groups = [
    {
      entries: labs,
      collection: 'labs',
      kind: 'Laboratório',
      action: 'Abrir o laboratório',
    },
    {
      entries: challenges,
      collection: 'challenges',
      kind: 'Desafio',
      action: 'Ver o desafio',
    },
    {
      entries: notes,
      collection: 'notes',
      kind: 'Nota técnica',
      action: 'Ler a nota',
    },
  ];
  for (const { entries, collection, kind, action } of groups) {
    for (const { id, data } of entries) {
      if (data.draft) continue;
      const key = `${collection}:${id}`;
      if (
        !(data.publishedAt instanceof Date) ||
        !Number.isFinite(data.publishedAt.getTime())
      ) {
        throw new Error(`Invalid publication date: ${key}`);
      }
      publications.push({
        key,
        title: data.title,
        summary: data.summary,
        kind,
        action,
        href:
          collection === 'labs'
            ? labUrl(id)
            : collection === 'challenges'
              ? `/desafios/${data.slug}`
              : `/notas/${id}`,
        publishedAt: data.publishedAt,
        topics: (data.cardTopics ?? data.topics ?? []).slice(0, 3),
        difficulty: data.difficulty
          ? difficultyLabels[data.difficulty]
          : undefined,
      });
    }
  }
  return publications;
}

/** @param {Publication[]} publications @param {string[]} references */
export function selectHomePublications(publications, references) {
  if (!Array.isArray(references))
    throw new Error('Home highlights must be an array');
  if (references.length > 3)
    throw new Error('Home supports at most three highlights');
  if (new Set(references).size !== references.length)
    throw new Error('Duplicate home highlight');
  const byKey = new Map(
    publications.map((publication) => [publication.key, publication]),
  );
  const featured = references.map((key) => {
    const publication = byKey.get(key);
    if (!publication)
      throw new Error(`Unknown or unpublished home highlight: ${key}`);
    return publication;
  });
  const recent = publications
    .filter((publication) => !references.includes(publication.key))
    .sort(
      (a, b) =>
        b.publishedAt.getTime() - a.publishedAt.getTime() ||
        (a.key < b.key ? -1 : a.key > b.key ? 1 : 0),
    )
    .slice(0, 6);
  return { featured, recent };
}
