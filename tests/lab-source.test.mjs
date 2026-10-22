import { test } from 'node:test';
import assert from 'node:assert/strict';
import { labSchema, labId, labsDirectory } from '../src/lib/lab-source.mjs';
const valid = {
  title: 'Laboratório de Cache',
  slug: '005-cache',
  summary: 'Rastros e explicação',
  question: 'Como funciona?',
  draft: false,
  publishedAt: '2026-10-21',
  topics: ['Cache'],
  prerequisites: ['C'],
  tools: ['cc'],
  environment: 'Linux',
  difficulty: 'intermediate',
};
test('published labs require meaningful metadata and real dates', () => {
  assert.equal(labSchema.safeParse(valid).success, true);
  for (const patch of [
    { title: 'Cache' },
    { publishedAt: undefined },
    { publishedAt: '2026-02-30' },
    { tools: [] },
    { topics: [' '] },
    { difficulty: 'unknown' },
  ])
    assert.equal(labSchema.safeParse({ ...valid, ...patch }).success, false);
  assert.equal(
    labSchema.safeParse({ ...valid, draft: true, publishedAt: undefined })
      .success,
    true,
  );
  assert.equal(
    labId({ entry: '005-cache/index.md', data: valid }),
    '005-cache',
  );
  assert.throws(() => labId({ entry: '004-cache/index.md', data: valid }));
});
test('local overrides cannot enter CI even if empty', () => {
  const prior = { ...process.env };
  try {
    process.env.LABS_SOURCE = '';
    process.env.CI = 'true';
    assert.throws(() => labsDirectory());
  } finally {
    process.env = prior;
  }
});
