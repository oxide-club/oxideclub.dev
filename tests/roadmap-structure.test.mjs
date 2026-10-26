import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveRoadmap,
  validateRoadmapGraph,
} from '../src/lib/roadmap-structure.mjs';
import { normalizeRoadmapDates } from '../src/lib/roadmap-source.mjs';
const entry = (id, data = {}) => ({
  id,
  data: { title: id, summary: 'Resumo canônico', draft: false, ...data },
});
const graph = () => ({
  nodes: [
    { ref: 'challenges:001-wc' },
    { ref: 'labs:001-binary-lab' },
    { ref: 'notes:representacao-binaria' },
  ],
  edges: [
    {
      from: 'notes:representacao-binaria',
      to: 'labs:001-binary-lab',
      type: 'suggested_preparation',
    },
  ],
});
const sources = () => ({
  challenges: [entry('001-wc', { difficulty: 'beginner' })],
  labs: [entry('001-binary-lab')],
  notes: [entry('representacao-binaria')],
  roadmaps: [],
});
test('normalizes dates parsed by Astro before JSON schema validation without mutating the input', () => {
  const input = { publishedAt: new Date('2026-10-25') };
  assert.deepEqual(normalizeRoadmapDates(input), { publishedAt: '2026-10-25' });
  assert.ok(input.publishedAt instanceof Date);
});
test('resolves all three canonical URLs and leaves note difficulty absent', () => {
  const r = resolveRoadmap(graph(), sources());
  assert.deepEqual(
    r.nodes.map((n) => n.url),
    [
      '/desafios/001-wc',
      '/labs/001-binary-lab/',
      '/notas/representacao-binaria/',
    ],
  );
  assert.equal(r.nodes[2].title, 'representacao-binaria');
  assert.equal(r.nodes[2].difficulty, undefined);
});
test('refreshes canonical titles on each resolution', () => {
  const s = sources();
  s.notes[0].data.title = 'Novo título';
  assert.equal(resolveRoadmap(graph(), s).nodes[2].title, 'Novo título');
});
for (const [label, mutate] of [
  ['missing', (s) => (s.notes = [])],
  ['draft', (s) => (s.notes[0].data.draft = true)],
  ['superseded', (s) => (s.labs[0].data.supersededBy = '017-arena')],
])
  test(`rejects ${label} canonical material`, () => {
    const s = sources();
    mutate(s);
    assert.throws(
      () => resolveRoadmap(graph(), s),
      /notes:representacao-binaria|labs:001-binary-lab/,
    );
  });
test('rejects cycles, unknown endpoints and layout paths that invent progression', () => {
  const d = graph();
  d.edges.push({
    from: 'labs:001-binary-lab',
    to: 'notes:representacao-binaria',
    type: 'branch',
  });
  assert.throws(() => validateRoadmapGraph(d), /Ciclo/);
  d.edges = [
    { from: 'notes:missing', to: 'labs:001-binary-lab', type: 'branch' },
  ];
  assert.throws(() => validateRoadmapGraph(d), /Aresta/);
  d.edges = [];
  d.layout = {
    primaryPath: ['notes:representacao-binaria', 'labs:001-binary-lab'],
  };
  assert.throws(() => validateRoadmapGraph(d), /principal/);
});
test('typed namespaces do not collide for numerically identical IDs', () => {
  const d = {
    nodes: [{ ref: 'challenges:001-example' }, { ref: 'labs:001-example' }],
    edges: [],
  };
  const r = resolveRoadmap(d, {
    ...sources(),
    challenges: [entry('001-example')],
    labs: [entry('001-example')],
  });
  assert.deepEqual(
    r.nodes.map((n) => n.url),
    ['/desafios/001-example', '/labs/001-example/'],
  );
});
