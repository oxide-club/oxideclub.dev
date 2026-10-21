/** @typedef {{q: string, area: string, difficulty: string, sort: 'number'|'title'|'difficulty', direction: 'asc'|'desc'}} ListState */

/** @param {URLSearchParams} params @param {{id: string}[]} areas @returns {ListState} */
export function parseListState(params, areas) {
  const area = params.get('area') || '';
  const difficulty = params.get('difficulty') || '';
  const sort = params.get('sort');
  return {
    q: params.get('q') || '',
    area: areas.some((a) => a.id === area) ? area : '',
    difficulty: ['beginner', 'intermediate', 'advanced'].includes(difficulty)
      ? difficulty
      : '',
    sort: sort === 'title' || sort === 'difficulty' ? sort : 'number',
    direction: params.get('direction') === 'desc' ? 'desc' : 'asc',
  };
}

/** @param {ListState} state @returns {URLSearchParams} */
export function serializeListState(state) {
  const params = new URLSearchParams();
  for (const key of ['q', 'area', 'difficulty'])
    if (state[key]) params.set(key, state[key]);
  if (state.sort !== 'number') params.set('sort', state.sort);
  if (state.direction !== 'asc') params.set('direction', state.direction);
  return params;
}

/** @template {{id: string, title: string, difficulty: string}} T @param {T[]} entries @param {Pick<ListState,'sort'|'direction'>} state @returns {T[]} */
export function orderChallengeRows(entries, state) {
  const rank = { beginner: 0, intermediate: 1, advanced: 2 };
  return [...entries].sort((a, b) => {
    const diff =
      state.sort === 'title'
        ? a.title.localeCompare(b.title, 'pt-BR')
        : state.sort === 'difficulty'
          ? rank[a.difficulty] - rank[b.difficulty]
          : a.id.localeCompare(b.id);
    return (
      diff * (state.direction === 'desc' ? -1 : 1) || a.id.localeCompare(b.id)
    );
  });
}
