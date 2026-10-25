import { publishedChallenges } from './challenges';
import { publishedNotes } from './notes';
import { publishedLabs } from './labs';
import { buildPublications } from './publication-catalogue.mjs';

export type { Publication } from './publication-catalogue.mjs';

export async function publishedContent() {
  const [challenges, notes, labs] = await Promise.all([
    publishedChallenges(),
    publishedNotes(),
    publishedLabs(),
  ]);
  return buildPublications({ labs, challenges, notes });
}
