import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseListState,
  serializeListState,
} from '../src/lib/challenge-list-state.mjs';
import { selectChallenges } from '../src/lib/challenge-catalogue.mjs';

const areas = [
  { id: 'memory', title: 'Memória' },
  { id: 'graphics', title: 'Gráficos' },
];
const defaults = {
  q: '',
  area: '',
  difficulty: '',
  sort: 'number',
  direction: 'asc',
};
test('state defaults, invalid parameters and duplicate first values are deterministic', () => {
  assert.deepEqual(parseListState(new URLSearchParams(), areas), defaults);
  assert.deepEqual(
    parseListState(
      new URLSearchParams('area=bad&difficulty=bad&sort=bad&direction=bad'),
      areas,
    ),
    defaults,
  );
  assert.deepEqual(
    parseListState(
      new URLSearchParams(
        'q=+arena+&area=memory&area=graphics&difficulty=intermediate&sort=title&direction=desc',
      ),
      areas,
    ),
    {
      q: ' arena ',
      area: 'memory',
      difficulty: 'intermediate',
      sort: 'title',
      direction: 'desc',
    },
  );
  assert.equal(serializeListState(defaults).toString(), '');
  const state = {
    ...defaults,
    q: 'alocação arena',
    area: 'memory',
    sort: 'difficulty',
    direction: 'desc',
  };
  assert.deepEqual(parseListState(serializeListState(state), areas), state);
});

const data = (title, difficulty, area) => ({
  title,
  difficulty,
  area,
  summary: 'Explore',
  topics: ['Alocação'],
  categories: ['build'],
  acceptedLanguages: ['C'],
});
const entries = [
  { id: '017-arena', data: data('Arena', 'intermediate', 'memory') },
  { id: '016-uaf', data: data('Árvore', 'beginner', 'memory') },
  { id: '002-ppm', data: data('Imagem', 'advanced', 'graphics') },
];
test('selection intersects query, area and level without mutation and keeps research topics searchable', () => {
  const before = structuredClone(entries);
  assert.deepEqual(
    selectChallenges(entries, areas, {
      ...defaults,
      q: 'MEMORIA ALOCACAO',
      difficulty: 'intermediate',
      area: 'memory',
    }).map((e) => e.id),
    ['017-arena'],
  );
  assert.deepEqual(
    selectChallenges(entries, areas, { ...defaults, q: '017' }).map(
      (e) => e.id,
    ),
    ['017-arena'],
  );
  assert.equal(
    selectChallenges(entries, areas, { ...defaults, q: 'none' }).length,
    0,
  );
  assert.deepEqual(entries, before);
});
test('sorts use canonical numbers, Portuguese titles and difficulty rank in both directions', () => {
  assert.deepEqual(
    selectChallenges(entries, areas, defaults).map((e) => e.id),
    ['002-ppm', '016-uaf', '017-arena'],
  );
  assert.deepEqual(
    selectChallenges(entries, areas, { ...defaults, sort: 'title' }).map(
      (e) => e.id,
    ),
    ['017-arena', '016-uaf', '002-ppm'],
  );
  assert.deepEqual(
    selectChallenges(entries, areas, {
      ...defaults,
      sort: 'difficulty',
      direction: 'desc',
    }).map((e) => e.id),
    ['002-ppm', '017-arena', '016-uaf'],
  );
  const tied = [entries[0], { ...entries[0], id: '010-buffer' }];
  assert.deepEqual(
    selectChallenges(tied, areas, {
      ...defaults,
      sort: 'title',
      direction: 'desc',
    }).map((e) => e.id),
    ['010-buffer', '017-arena'],
  );
});
