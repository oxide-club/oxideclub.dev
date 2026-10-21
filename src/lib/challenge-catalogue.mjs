import { categoryLabels } from './challenge-taxonomy.mjs';
import { challengeLanguages } from './challenge-languages.mjs';

export const difficultyLabels = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

/**
 * @param {{id: string, data: {title: string, summary: string, topics: string[], cardTopics?: string[], categories: (keyof typeof categoryLabels)[], difficulty: keyof typeof difficultyLabels, difficultyContext?: string, acceptedLanguages?: string[], recommendedLanguage?: string}}} challenge
 */
export function challengeSearchText({ id, data }, areaTitle = '') {
  return [
    id,
    data.title,
    areaTitle,
    data.summary,
    ...data.topics,
    ...(data.cardTopics ?? []),
    ...data.categories.map((category) => categoryLabels[category]),
    ...challengeLanguages(data),
    data.recommendedLanguage ?? '',
    data.difficulty,
    difficultyLabels[data.difficulty],
    data.difficultyContext ?? '',
  ].join(' ');
}

/** @template {{ id: string }} T @param {T[]} entries @returns {T[]} */
export function ascendingChallenges(entries) {
  return [...entries].sort((a, b) => a.id.localeCompare(b.id));
}

/** @template {{id: string, data: {area: string}}} T @param {T[]} entries @param {import('./challenge-areas.mjs').Area[]} areas */
export function groupChallengesByArea(entries, areas) {
  return areas
    .map((area) => ({
      area,
      challenges: ascendingChallenges(
        entries.filter((entry) => entry.data.area === area.id),
      ),
    }))
    .filter((group) => group.challenges.length > 0);
}

export { matchesChallenge } from './challenge-search.mjs';
