import { categoryLabels } from './challenge-taxonomy.mjs';
import { challengeLanguages } from './challenge-languages.mjs';
import { matchesChallenge } from './challenge-search.mjs';
import { orderChallengeRows } from './challenge-list-state.mjs';

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

/** @param {any[]} entries @param {{id: string, title: string}[]} areas @param {import('./challenge-list-state.mjs').ListState} state */
export function selectChallenges(entries, areas, state) {
  const rows = entries.filter(
    (entry) =>
      (!state.area || entry.data.area === state.area) &&
      (!state.difficulty || entry.data.difficulty === state.difficulty) &&
      matchesChallenge(
        challengeSearchText(
          entry,
          areas.find((area) => area.id === entry.data.area)?.title ?? '',
        ),
        entry.data.topics,
        state.q,
        '',
      ),
  );
  return orderChallengeRows(
    rows.map((entry) => ({
      id: entry.id,
      title: entry.data.title,
      difficulty: entry.data.difficulty,
      entry,
    })),
    state,
  ).map((row) => row.entry);
}
