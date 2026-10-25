import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { publicationRevisions } from '../src/lib/publication-revisions.mjs';
test('local production reads synced checkout revisions without CI environment variables', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'oxide-publication-revisions-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const expected = {};
  for (const name of ['challenges', 'notes', 'labs']) {
    const path = join(root, '.content', name);
    await mkdir(path, { recursive: true });
    const git = (...args) =>
      execFileSync('git', ['-C', path, ...args], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }).trim();
    git('init', '-b', 'main');
    git('config', 'user.name', 'Fixture');
    git('config', 'user.email', 'fixture@example.test');
    git('commit', '--allow-empty', '-m', name);
    expected[name] = git('rev-parse', 'HEAD');
  }
  assert.deepEqual(await publicationRevisions({ root }), expected);
});
test('CI snapshots are used explicitly; missing checkouts and malformed SHAs fail closed', async () => {
  const revisions = {
    challenges: 'a'.repeat(40),
    notes: 'b'.repeat(40),
    labs: 'e'.repeat(40),
  };
  assert.deepEqual(
    await publicationRevisions({ root: '/not-a-site', revisions }),
    revisions,
  );
  await assert.rejects(
    publicationRevisions({ root: '/not-a-site' }),
    /revision/,
  );
  await assert.rejects(
    publicationRevisions({ revisions: { ...revisions, notes: 'bad' } }),
    /revision/,
  );
});

test('production cannot omit or corrupt the labs snapshot', async () => {
  for (const labs of [undefined, '', 'bad'])
    await assert.rejects(
      publicationRevisions({
        root: '/not-a-site',
        revisions: {
          challenges: 'a'.repeat(40),
          notes: 'b'.repeat(40),
          labs,
        },
      }),
      /labs/,
    );
});
