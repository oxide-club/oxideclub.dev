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
  symlink,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { syncMeetings, validateMeetings } from '../scripts/sync-meetings.mjs';
const git = (root, ...args) =>
  execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'oxide-meetings-sync-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const repository = join(directory, 'remote'),
    root = join(directory, 'site');
  await mkdir(repository);
  for (const name of ['meetings', 'assets', 'templates'])
    await mkdir(join(repository, name));
  for (const path of [
    'README.md',
    'CONTRIBUTING.md',
    'LICENSE',
    'templates/meeting.md',
    'meetings/.gitkeep',
    'assets/.gitkeep',
  ])
    await writeFile(join(repository, path), 'Fixture\n');
  await mkdir(root);
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
      'content',
    );
    return git(repository, 'rev-parse', 'HEAD');
  };
  return { directory, repository, root, commit, revision: commit() };
}
test('documented empty meetings sync, record snapshot, adopt changes and preserve dirty checkout', async (t) => {
  const f = await fixture(t),
    githubEnv = join(f.directory, 'env');
  assert.equal(await syncMeetings({ ...f, githubEnv }), f.revision);
  assert.equal(
    await readFile(githubEnv, 'utf8'),
    `MEETINGS_COMMIT=${f.revision}\n`,
  );
  await writeFile(
    join(f.repository, 'meetings/001-a.md'),
    '---\ntitle: a\n---\n',
  );
  const revision = f.commit();
  assert.equal(await syncMeetings(f), revision);
  await writeFile(join(f.root, '.content/meetings/README.md'), 'local');
  await assert.rejects(syncMeetings(f), /modified/);
});
test('selected snapshot works offline and mismatched snapshots fail', async (t) => {
  const f = await fixture(t);
  await assert.rejects(
    syncMeetings({ ...f, expectedRevision: f.revision }),
    /snapshot/,
  );
  await syncMeetings(f);
  await rename(f.repository, `${f.repository}-offline`);
  assert.equal(
    await syncMeetings({ ...f, expectedRevision: f.revision }),
    f.revision,
  );
  await assert.rejects(
    syncMeetings({ ...f, expectedRevision: '0'.repeat(40) }),
    /snapshot/,
  );
  await assert.rejects(syncMeetings(f));
});
test('source validates paths and assets and rejects nested definitions and symlinks', async (t) => {
  const f = await fixture(t);
  await validateMeetings(f.repository);
  await writeFile(join(f.repository, 'meetings/Bad.md'), 'bad');
  await assert.rejects(validateMeetings(f.repository), /filename/);
  await rm(join(f.repository, 'meetings/Bad.md'));
  await mkdir(join(f.repository, 'meetings/nested'));
  await assert.rejects(validateMeetings(f.repository), /filename/);
  await rm(join(f.repository, 'meetings/nested'), { recursive: true });
  await mkdir(join(f.repository, 'assets/001-a'));
  await symlink(
    '../../README.md',
    join(f.repository, 'assets/001-a/linked.txt'),
  );
  await assert.rejects(
    validateMeetings(f.repository),
    /Unsafe|Symbolic|symlink/,
  );
});
test('local preview reads source without copying and CI and production reject it', async (t) => {
  const f = await fixture(t);
  assert.equal(
    await syncMeetings({
      ...f,
      localSource: f.repository,
      ci: false,
      production: false,
    }),
    null,
  );
  await assert.rejects(readFile(join(f.root, '.content/meetings/README.md')), {
    code: 'ENOENT',
  });
  for (const flags of [{ ci: true }, { production: true }])
    await assert.rejects(
      syncMeetings({ ...f, localSource: f.repository, ...flags }),
      /CI|production/,
    );
  await assert.rejects(
    syncMeetings({
      ...f,
      localSource: 'relative',
      ci: false,
      production: false,
    }),
    /absolute/,
  );
});
