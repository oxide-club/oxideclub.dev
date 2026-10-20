import { test } from 'node:test';
import assert from 'node:assert/strict';
import { noteId, noteSchema } from '../src/lib/note-source.mjs';

test('notes derive IDs from one canonical directory without slug metadata', () => {
  assert.equal(
    noteId({ entry: 'streams-e-eof/index.md', data: {} }),
    'streams-e-eof',
  );
  for (const entry of [
    'templates/note.md',
    'scripts/index.md',
    'tests/index.md',
    'Bad_slug/index.md',
    'foo/bar/index.md',
  ]) {
    assert.throws(() => noteId({ entry, data: {} }));
  }
  assert.throws(() =>
    noteId({ entry: 'streams/index.md', data: { slug: 'other' } }),
  );
});
test('published notes require dates and drafts may omit dates', () => {
  const base = { title: 'Nota', summary: 'Uma investigação' };
  assert.equal(noteSchema.safeParse(base).success, false);
  assert.equal(noteSchema.parse({ ...base, draft: true }).draft, true);
  assert.equal(
    noteSchema.parse({ ...base, publishedAt: '2026-10-20' }).draft,
    false,
  );
  assert.equal(
    noteSchema.safeParse({ ...base, publishedAt: 'invalid' }).success,
    false,
  );
});
