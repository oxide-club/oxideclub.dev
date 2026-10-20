import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdtemp,
  mkdir,
  cp,
  writeFile,
  readFile,
  rm,
  rename,
  access,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { syncSolutions } from '../scripts/sync-solutions.mjs';

const source = resolve(process.env.SOLUTIONS_SOURCE || '.content/solutions');
function git(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
  }).trim();
}
async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'oxide-solutions-sync-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const repository = join(directory, 'remote');
  const root = join(directory, 'site');
  await mkdir(repository);
  await mkdir(root);
  await cp(
    join(source, 'community.schema.json'),
    join(repository, 'community.schema.json'),
  );
  await mkdir(join(repository, '001-wc'));
  const catalogue = join(repository, '001-wc/community.yaml');
  await writeFile(catalogue, 'implementations: []\n');
  git(repository, 'init', '-b', 'main');
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
      'metadata',
    );
    return git(repository, 'rev-parse', 'HEAD');
  };
  return {
    directory,
    root,
    repository,
    catalogue,
    commit,
    revision: commit(),
    localSource: undefined,
  };
}
// These tests use a local Git remote, never the network.
const remoteOptions = (f) => ({ ...f, localSource: undefined });

test('solutions sync adopts latest metadata, exports and reuses a snapshot offline, rejects mismatches', async (t) => {
  const f = await fixture(t);
  // Empty localSource is supplied via environment in local tests; clear that default explicitly.
  const previous = process.env.SOLUTIONS_SOURCE;
  delete process.env.SOLUTIONS_SOURCE;
  try {
    const githubEnv = join(f.directory, 'env');
    assert.equal(
      await syncSolutions({ ...remoteOptions(f), githubEnv }),
      f.revision,
    );
    assert.equal(
      await readFile(githubEnv, 'utf8'),
      `SOLUTIONS_COMMIT=${f.revision}\n`,
    );
    await writeFile(f.catalogue, 'implementations: []\n# revision two\n');
    const next = f.commit();
    assert.equal(await syncSolutions(remoteOptions(f)), next);
    await rename(f.repository, `${f.repository}-offline`);
    assert.equal(
      await syncSolutions({ ...remoteOptions(f), expectedRevision: next }),
      next,
    );
    await assert.rejects(
      syncSolutions({ ...remoteOptions(f), expectedRevision: '0'.repeat(40) }),
      /snapshot/,
    );
    await assert.rejects(syncSolutions(remoteOptions(f)), /Git/);
  } finally {
    if (previous !== undefined) process.env.SOLUTIONS_SOURCE = previous;
  }
});
test('invalid metadata cannot replace a valid snapshot and local cache edits are preserved', async (t) => {
  const f = await fixture(t);
  const previous = process.env.SOLUTIONS_SOURCE;
  delete process.env.SOLUTIONS_SOURCE;
  try {
    await syncSolutions(remoteOptions(f));
    await writeFile(f.catalogue, 'implementations: [broken]');
    f.commit();
    await assert.rejects(syncSolutions(remoteOptions(f)), /community.yaml/);
    const cached = join(f.root, '.content/solutions/001-wc/community.yaml');
    assert.equal(await readFile(cached, 'utf8'), 'implementations: []\n');
    await writeFile(cached, 'implementations: []\n# local edit\n');
    await assert.rejects(syncSolutions(remoteOptions(f)), /modified/);
    assert.match(await readFile(cached, 'utf8'), /local edit/);
  } finally {
    if (previous !== undefined) process.env.SOLUTIONS_SOURCE = previous;
  }
});
test('local source is read directly and forbidden in CI or production', async (t) => {
  const f = await fixture(t);
  assert.equal(
    await syncSolutions({
      root: f.root,
      localSource: f.repository,
      ci: false,
      production: false,
    }),
    null,
  );
  await assert.rejects(access(join(f.root, '.content')));
  for (const options of [{ ci: true }, { production: true }])
    await assert.rejects(
      syncSolutions({ localSource: '/missing', ...options }),
      /forbidden/,
    );
  await assert.rejects(
    syncSolutions({ localSource: 'relative', ci: false, production: false }),
    /absolute/,
  );
});
