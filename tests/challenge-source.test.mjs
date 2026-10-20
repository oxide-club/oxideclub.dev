import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  rename,
  rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { syncChallenges } from '../scripts/sync-challenges.mjs';
import { challengeId } from '../src/lib/challenge-source.mjs';

function git(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
  }).trim();
}

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'oxide-source-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const repository = join(directory, 'remote');
  const root = join(directory, 'site');
  await mkdir(repository);
  await mkdir(root);
  git(repository, 'init', '-b', 'main');
  await mkdir(join(repository, '001-wc'));
  const definition = join(repository, '001-wc/index.md');
  const commit = () => {
    git(repository, 'add', '.');
    git(
      repository,
      '-c',
      'user.name=Test',
      '-c',
      'user.email=test@example.invalid',
      'commit',
      '-m',
      'content',
    );
    return git(repository, 'rev-parse', 'HEAD');
  };
  await writeFile(definition, "---\nslug: '001-wc'\n---\nOriginal\n");
  const revision = commit();
  return { directory, repository, root, definition, commit, revision };
}

test('each fresh sync adopts latest main and records the fetched revision', async (t) => {
  const f = await fixture(t);
  const githubEnv = join(f.directory, 'github-env');
  const first = await syncChallenges({ ...f, githubEnv });
  assert.equal(first, f.revision);
  assert.equal(
    await readFile(githubEnv, 'utf8'),
    `CHALLENGES_COMMIT=${first}\n`,
  );
  await writeFile(f.definition, "---\nslug: '001-wc'\n---\nUpdated\n");
  const next = f.commit();
  assert.notEqual(next, first);
  assert.equal(await syncChallenges(f), next);
  assert.match(
    await readFile(join(f.root, '.content/challenges/001-wc/index.md'), 'utf8'),
    /Updated/,
  );
});

test('workflow steps reuse the selected snapshot without refetching main', async (t) => {
  const f = await fixture(t);
  await syncChallenges(f);
  await rename(f.repository, `${f.repository}-unavailable`);
  assert.equal(
    await syncChallenges({ ...f, expectedRevision: f.revision }),
    f.revision,
  );
});

test('fetch failures fail rather than silently returning cached content', async (t) => {
  const f = await fixture(t);
  await syncChallenges(f);
  await rename(f.repository, `${f.repository}-unavailable`);
  await assert.rejects(syncChallenges(f));
  assert.equal(
    git(join(f.root, '.content/challenges'), 'rev-parse', 'HEAD'),
    f.revision,
  );
});

test('a missing or mismatched workflow snapshot fails', async (t) => {
  const f = await fixture(t);
  await assert.rejects(
    syncChallenges({ ...f, expectedRevision: f.revision }),
    /snapshot/i,
  );
  await syncChallenges(f);
  await assert.rejects(
    syncChallenges({ ...f, expectedRevision: '0'.repeat(40) }),
    /snapshot/i,
  );
});

test('sync preserves edits to the generated checkout and reports them', async (t) => {
  const f = await fixture(t);
  await syncChallenges(f);
  const path = join(f.root, '.content/challenges/001-wc/index.md');
  await writeFile(path, 'local work');
  await assert.rejects(syncChallenges(f), /modified/i);
  assert.equal(await readFile(path, 'utf8'), 'local work');
});

test('an empty content repository cannot replace a valid checkout', async (t) => {
  const f = await fixture(t);
  await syncChallenges(f);
  await rm(join(f.repository, '001-wc'), { recursive: true });
  await writeFile(join(f.repository, 'README.md'), 'No definitions');
  f.commit();
  await assert.rejects(syncChallenges(f), /definitions/i);
  assert.equal(
    git(join(f.root, '.content/challenges'), 'rev-parse', 'HEAD'),
    f.revision,
  );
});

test('content IDs come from numbered directories and must match slugs', () => {
  assert.equal(
    challengeId({ entry: '001-wc/index.md', data: { slug: '001-wc' } }),
    '001-wc',
  );
  for (const entry of [
    'README.md',
    '001-wc/README.md',
    '000-wc/index.md',
    'wc/index.md',
  ]) {
    assert.throws(
      () => challengeId({ entry, data: { slug: '001-wc' } }),
      /identifier/i,
    );
  }
  assert.throws(
    () =>
      challengeId({ entry: '001-wc/index.md', data: { slug: 'recriando-wc' } }),
    /slug/i,
  );
});

test('reference links are optional and select a maintained language implementation', () => {
  const entry = '001-wc/index.md';
  for (const language of ['c', 'rust']) {
    assert.equal(
      challengeId({
        entry,
        data: {
          slug: '001-wc',
          referenceUrl: `https://github.com/oxide-club/solutions/tree/main/001-wc/${language}`,
        },
      }),
      '001-wc',
    );
  }
  for (const referenceUrl of [
    'javascript:alert(1)',
    'https://github.com/oxide-club/solutions/tree/main/002-ppm/c',
    'https://example.com/001-wc/c',
    'https://github.com/oxide-club/solutions/tree/main/001-wc/c?extra=1',
  ]) {
    assert.throws(
      () => challengeId({ entry, data: { slug: '001-wc', referenceUrl } }),
      /Reference URL/,
    );
  }
});
