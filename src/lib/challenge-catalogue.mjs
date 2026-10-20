/** @template {{ id: string }} T @param {T[]} entries @returns {T[]} */
export function descendingChallenges(entries) {
  return [...entries].sort((a, b) => b.id.localeCompare(a.id));
}

/** @param {string} value */
function normalize(value) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('pt-BR');
}

/**
 * @param {string} text
 * @param {string[]} topics
 * @param {string} query
 * @param {string} selectedTopic
 */
export function matchesChallenge(text, topics, query, selectedTopic) {
  const haystack = normalize(text);
  return (
    (!selectedTopic || topics.includes(selectedTopic)) &&
    normalize(query)
      .trim()
      .split(/\s+/)
      .every((word) => haystack.includes(word))
  );
}
