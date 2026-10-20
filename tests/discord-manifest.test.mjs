import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createManifest, validateManifest } from '../src/lib/publication-manifest.mjs';
const revisions = { challenges: 'a'.repeat(40), notes: 'b'.repeat(40) };
const entry = (id, data = {}) => ({ id, data: { title: 'Memória & café', summary: 'Uma explicação.', draft: false, ...data } });
test('manifest uses published entries, fixed production URLs and deterministic ordering', () => {
  const manifest = createManifest({ challenges: [entry('004-http'), entry('005-draft', { draft: true })], notes: [entry('zeta'), entry('alpha')], revisions, production: true });
  assert.deepEqual(manifest.entries.map(({ url }) => url), ['https://oxideclub.dev/desafios/004-http', 'https://oxideclub.dev/notas/alpha', 'https://oxideclub.dev/notas/zeta']);
  assert.equal(manifest.entries[1].title, 'Memória & café');
  assert.deepEqual(manifest.revisions, revisions);
  assert.equal(manifest.production, true);
  assert.deepEqual(createManifest({ production: false }).entries, []);
});
test('invalid identifiers, duplicate entries and malformed production snapshots fail', () => {
  assert.throws(() => createManifest({ production: true }), /revision/);
  for (const notes of [[entry('../evil')], [entry('x'), entry('x')]]) assert.throws(() => createManifest({ notes, revisions, production: true }));
  const valid = createManifest({ notes: [entry('alpha')], revisions, production: true });
  assert.throws(() => validateManifest({ ...valid, entries: [{ ...valid.entries[0], url: 'https://evil.test/' }] }), /URL/);
  assert.throws(() => validateManifest({ ...valid, production: false }), /production/);
});
