import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as catalogue from '../src/lib/publication-catalogue.mjs';

const entry = (id, extra = {}) => ({
  id: `001-${id}`,
  data: {
    title: id,
    summary: 'Resumo',
    slug: `001-${id}`,
    draft: false,
    publishedAt: new Date('2026-10-20'),
    topics: ['Memória'],
    difficulty: 'intermediate',
    ...extra,
  },
});
const collections = () => ({
  labs: [entry('lab')],
  challenges: [entry('challenge')],
  notes: [
    entry('note', { slug: undefined, difficulty: undefined, topics: [] }),
  ],
});

test('normalizes published labs, challenges and notes with their canonical destinations and actions', () => {
  const data = collections();
  data.labs.push(entry('draft', { draft: true }));
  const result = catalogue.buildPublications(data);
  assert.deepEqual(
    result.map((p) => [p.key, p.href, p.kind, p.action]),
    [
      ['labs:001-lab', '/labs/001-lab/', 'Laboratório', 'Abrir o laboratório'],
      [
        'challenges:001-challenge',
        '/desafios/001-challenge',
        'Desafio',
        'Ver o desafio',
      ],
      ['notes:001-note', '/notas/001-note', 'Nota técnica', 'Ler a nota'],
    ],
  );
  assert.equal(result[0].difficulty, 'Intermediário');
  assert.equal(result[2].difficulty, undefined);
  assert.deepEqual(result[2].topics, []);
  assert.deepEqual(catalogue.buildPublications({}), []);
});

test('uses challenge card topics and rejects invalid or absent original publication dates', () => {
  assert.deepEqual(
    catalogue.buildPublications({
      challenges: [entry('x', { cardTopics: ['Bytes'] })],
    })[0].topics,
    ['Bytes'],
  );
  for (const publishedAt of [undefined, new Date('invalid')]) {
    assert.throws(
      () =>
        catalogue.buildPublications({ labs: [entry('bad', { publishedAt })] }),
      /publication date.*labs:001-bad/i,
    );
  }
  assert.deepEqual(
    catalogue.buildPublications({
      notes: [entry('draft', { draft: true, publishedAt: undefined })],
    }),
    [],
  );
});

test('editorial order selects the primary and up to two secondary publications across types', () => {
  const all = catalogue.buildPublications(collections());
  for (const refs of [
    [],
    ['notes:001-note'],
    ['notes:001-note', 'labs:001-lab'],
    ['notes:001-note', 'labs:001-lab', 'challenges:001-challenge'],
  ]) {
    const result = catalogue.selectHomePublications(all, refs);
    assert.deepEqual(
      result.featured.map((p) => p.key),
      refs,
    );
    assert.equal(result.recent.length, 3 - refs.length);
  }
  assert.deepEqual(catalogue.selectHomePublications([], []), {
    featured: [],
    recent: [],
  });
});

test('invalid editorial references fail rather than silently selecting another publication', () => {
  const all = catalogue.buildPublications(collections());
  assert.throws(
    () => catalogue.selectHomePublications(all, ['labs:001-missing']),
    /unknown.*labs:001-missing/i,
  );
  assert.throws(
    () =>
      catalogue.selectHomePublications(all, ['labs:001-lab', 'labs:001-lab']),
    /duplicate/i,
  );
  assert.throws(
    () => catalogue.selectHomePublications(all, ['a', 'b', 'c', 'd']),
    /three/i,
  );
  assert.throws(
    () => catalogue.selectHomePublications(all, 'labs:001-lab'),
    /array/i,
  );
});

test('recent publications use original dates, deterministic ties, six-item limit and exclude highlights', () => {
  const labs = [
    entry('old', {
      publishedAt: new Date('2020-01-01'),
      updatedAt: new Date('2030-01-01'),
    }),
    entry('featured', { publishedAt: new Date('2026-10-26') }),
  ];
  for (const id of ['g', 'f', 'e', 'd', 'c', 'b', 'a']) labs.push(entry(id));
  const all = catalogue.buildPublications({ labs });
  const before = [...all];
  assert.deepEqual(
    catalogue
      .selectHomePublications(all, ['labs:001-featured'])
      .recent.map((p) => p.key),
    [
      'labs:001-a',
      'labs:001-b',
      'labs:001-c',
      'labs:001-d',
      'labs:001-e',
      'labs:001-f',
    ],
  );
  assert.deepEqual(
    catalogue
      .selectHomePublications([...all].reverse(), ['labs:001-featured'])
      .recent.map((p) => p.key),
    [
      'labs:001-a',
      'labs:001-b',
      'labs:001-c',
      'labs:001-d',
      'labs:001-e',
      'labs:001-f',
    ],
  );
  assert.deepEqual(all, before);
});
