import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, cp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { stringify } from 'yaml';
import { loadCommunity } from '../src/lib/community.ts';

const source = resolve(process.env.SOLUTIONS_SOURCE || '.content/solutions');
const entry = {
  author: 'Ágata 🦀',
  language: 'Rust',
  url: 'https://codeberg.org/example/wc',
  status: 'completed',
};
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'oxide-community-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await cp(
    join(source, 'community.schema.json'),
    join(root, 'community.schema.json'),
  );
  await mkdir(join(root, '001-wc'));
  const path = join(root, '001-wc/community.yaml');
  const write = (entries) =>
    writeFile(path, stringify({ implementations: entries }));
  return { root, path, write };
}
test('loads empty, Unicode, optional fields, partial and same-author implementations by canonical ID', async (t) => {
  const { root, write } = await fixture(t);
  await write([]);
  assert.deepEqual((await loadCommunity(root)).get('001-wc'), []);
  await write([
    entry,
    {
      ...entry,
      language: 'Zig',
      url: 'https://example.org/wc.zig',
      status: 'partial',
      authorUrl: 'https://example.org/ágata',
      notes: '<script>alert(1)</script>',
    },
  ]);
  const entries = (await loadCommunity(root)).get('001-wc');
  assert.equal(entries.length, 2);
  assert.equal(entries[1].status, 'partial');
  assert.equal(entries[0].authorUrl, undefined);
  assert.equal(entries[1].notes, '<script>alert(1)</script>');
});
test('rejects malformed YAML, missing list, unknown fields and duplicate mapping keys with filename', async (t) => {
  const { root, path } = await fixture(t);
  for (const value of [
    'implementations: [',
    '{}',
    'implementations: {}',
    'implementations: []\nextra: true',
    'implementations: []\nimplementations: []',
  ]) {
    await writeFile(path, value);
    await assert.rejects(loadCommunity(root), /001-wc\/community.yaml/);
  }
});
test('rejects missing/wrong fields, unsafe URLs, unknown status, duplicates and unsorted entries', async (t) => {
  const { root, write } = await fixture(t);
  for (const field of ['author', 'language', 'url', 'status']) {
    const invalid = { ...entry };
    delete invalid[field];
    await write([invalid]);
    await assert.rejects(loadCommunity(root), /implementations/);
  }
  for (const patch of [
    { author: 1 },
    { author: ' ' },
    { language: false },
    { notes: [] },
    { status: 'verified' },
    { authorUrl: null },
    { extra: true },
    ...[
      'http://example.org',
      'javascript:alert(1)',
      'data:text/plain,x',
      'https://',
      'https:///path',
      'https://bad host/x',
      'https://user:pass@example.org',
      'https://example.org:bad/x',
      'https://256.256.256.256/x',
      'https://999999999999/x',
      'https://%ZZ/x',
      'https://a\u200db.com/x',
      'https://a\u200cb.com/x',
    ].flatMap((url) => [{ url }, { authorUrl: url }]),
  ]) {
    await write([{ ...entry, ...patch }]);
    await assert.rejects(
      loadCommunity(root),
      /community.yaml.*implementations/s,
    );
  }
  await write([entry, { ...entry, language: 'Zig' }]);
  await assert.rejects(loadCommunity(root), /duplicad/);
  await write([
    { ...entry, author: 'Z' },
    { ...entry, author: 'A', url: 'https://example.org/wc' },
  ]);
  await assert.rejects(loadCommunity(root), /ordem/);
});
test('missing and orphan catalogues fail rather than silently disappearing', async (t) => {
  const { root, path, write } = await fixture(t);
  await assert.rejects(loadCommunity(root), /001-wc\/community.yaml/);
  await write([]);
  await mkdir(join(root, 'docs'));
  await cp(path, join(root, 'docs/community.yaml'));
  await assert.rejects(loadCommunity(root), /docs\/community.yaml/);
});

test('YAML 1.2 scalar and alias semantics agree with solutions validation', async (t) => {
  const { root, path } = await fixture(t);
  const text = `implementations:
  - author: &name On
    language: Rust
    url: https://example.org/code
    status: completed
    notes: *name
`;
  await writeFile(path, text);
  const entry = (await loadCommunity(root)).get('001-wc')[0];
  assert.equal(entry.author, 'On');
  assert.equal(entry.notes, 'On');
  await writeFile(path, text.replace('&name On', '&name 0o123'));
  await assert.rejects(loadCommunity(root), /community.yaml.*implementations/s);
});

test('date-like notes remain text and YAML merges have the same meaning in both validators', async (t) => {
  const { root, path } = await fixture(t);
  for (const notes of ['2026-10-20', '2026-10-20T00:00:00Z']) {
    await writeFile(
      path,
      `implementations:
  - &base
    author: Ada
    language: C
    url: https://example.org/c
    status: completed
    notes: ${notes}
  - <<: *base
    language: Rust
    url: https://example.org/rust
`,
    );
    const entries = (await loadCommunity(root)).get('001-wc');
    assert.equal(entries[0].notes, notes);
    assert.equal(entries[1].author, 'Ada');
    assert.equal(entries[1].notes, notes);
  }
});
