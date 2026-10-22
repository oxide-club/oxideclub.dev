import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  loadChallengeAreas,
  validateChallengeArea,
} from '../src/lib/challenge-areas.mjs';
import {
  groupChallengesByArea,
  challengeSearchText,
} from '../src/lib/challenge-catalogue.mjs';

const memory = {
  id: 'memory',
  slug: 'memoria',
  title: 'Memória',
  description: 'Explore memória.',
};
const graphics = {
  id: 'graphics',
  slug: 'graficos',
  title: 'Gráficos',
  description: 'Explore imagens.',
};

test('registry reads the selected source, preserves order and does not cache another source', async (t) => {
  const { rm } = await import('node:fs/promises');
  const root = await mkdtemp(join(tmpdir(), 'oxide-areas-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const [name, data] of [
    ['a', [memory, graphics]],
    ['b', [graphics]],
  ]) {
    await mkdir(join(root, name));
    await writeFile(join(root, name, 'areas.json'), JSON.stringify(data));
  }
  assert.deepEqual(await loadChallengeAreas(join(root, 'a')), [
    memory,
    graphics,
  ]);
  assert.deepEqual(await loadChallengeAreas(join(root, 'b')), [graphics]);
});

test('registry rejects missing, malformed, duplicate, empty and unsafe entries with file context', async (t) => {
  const { rm } = await import('node:fs/promises');
  const root = await mkdtemp(join(tmpdir(), 'oxide-areas-invalid-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await assert.rejects(loadChallengeAreas(root), /areas.json/);
  for (const data of [
    [],
    {},
    [null],
    [{ ...memory, title: ' ' }],
    [{ ...memory, id: '../memory' }],
    [{ ...memory, slug: 'Bad' }],
    [memory, memory],
    [memory, { ...memory, id: 'other' }],
    [memory, { ...memory, slug: 'other' }],
  ]) {
    await writeFile(join(root, 'areas.json'), JSON.stringify(data));
    await assert.rejects(loadChallengeAreas(root), /areas.json/);
  }
  await writeFile(join(root, 'areas.json'), '{bad');
  await assert.rejects(loadChallengeAreas(root), /areas.json/);
  const { unlink } = await import('node:fs/promises');
  await unlink(join(root, 'areas.json'));
  await writeFile(join(root, 'real.json'), JSON.stringify([memory]));
  await symlink(join(root, 'real.json'), join(root, 'areas.json'));
  await assert.rejects(loadChallengeAreas(root), /areas.json/);
});

test('every definition including drafts requires one known area', () => {
  assert.equal(
    validateChallengeArea('memory', [memory], '017-arena'),
    'memory',
  );
  for (const area of [undefined, null, [], ['memory'], '', 'other'])
    assert.throws(
      () => validateChallengeArea(area, [memory], '017-arena'),
      /017-arena.*area/,
    );
});

test('groups use editorial area order, omit empty groups and preserve canonical challenge order', () => {
  const entries = [
    { id: '017-arena', data: { area: 'memory' } },
    { id: '002-ppm', data: { area: 'graphics' } },
    { id: '016-uaf', data: { area: 'memory' } },
  ];
  const snapshot = structuredClone(entries);
  const groups = groupChallengesByArea(entries, [
    graphics,
    memory,
    { ...graphics, id: 'empty' },
  ]);
  assert.deepEqual(
    groups.map((g) => [g.area.id, g.challenges.map((c) => c.id)]),
    [
      ['graphics', ['002-ppm']],
      ['memory', ['016-uaf', '017-arena']],
    ],
  );
  assert.deepEqual(entries, snapshot);
});

test('clean titles retain ID and area in search text', () => {
  const text = challengeSearchText(
    {
      id: '017-arena',
      data: {
        title: 'Arena',
        summary: 'Alocador',
        topics: ['Alinhamento'],
        categories: ['build'],
        difficulty: 'intermediate',
        acceptedLanguages: ['C'],
      },
    },
    'Memória e alocação',
  );
  assert.match(text, /017-arena/);
  assert.match(text, /Memória e alocação/);
});
