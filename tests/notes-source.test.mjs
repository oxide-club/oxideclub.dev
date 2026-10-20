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
import { syncNotes } from '../scripts/sync-notes.mjs';

function git(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}
async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'oxide-notes-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const repository = join(directory, 'remote');
  const root = join(directory, 'site');
  await mkdir(repository);
  await mkdir(root);
  git(repository, 'init', '-b', 'main');
  await mkdir(join(repository, 'templates'));
  for (const path of [
    'README.md',
    'CONTRIBUTING.md',
    'LICENSE',
    'templates/note.md',
  ]) {
    await writeFile(join(repository, path), 'Documentation\n');
  }
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

test('empty documented notes repository syncs and exports its snapshot', async (t) => {
  const f = await fixture(t);
  const githubEnv = join(f.directory, 'env');
  assert.equal(await syncNotes({ ...f, githubEnv }), f.revision);
  assert.equal(
    await readFile(githubEnv, 'utf8'),
    `NOTES_COMMIT=${f.revision}\n`,
  );
  await mkdir(join(f.repository, 'ownership'));
  await writeFile(join(f.repository, 'ownership/index.md'), '# Ownership');
  const next = f.commit();
  assert.equal(await syncNotes(f), next);
  assert.equal(
    await readFile(join(f.root, '.content/notes/ownership/index.md'), 'utf8'),
    '# Ownership',
  );
});

test('notes sync accepts repository automation without treating it as an article', async (t) => {
  const f = await fixture(t);
  await mkdir(join(f.repository, 'scripts/discord'), { recursive: true });
  await writeFile(
    join(f.repository, 'scripts/discord/contributions.mjs'),
    '// Repository automation, not a note.\n',
  );
  await mkdir(join(f.repository, 'tests'));
  await writeFile(
    join(f.repository, 'tests/discord.test.mjs'),
    '// Automation tests.\n',
  );
  await mkdir(join(f.repository, 'streams'));
  await writeFile(join(f.repository, 'streams/index.md'), '# Streams');
  const revision = f.commit();
  assert.equal(await syncNotes(f), revision);
  assert.equal(
    await readFile(join(f.root, '.content/notes/streams/index.md'), 'utf8'),
    '# Streams',
  );
});

test('notes sync still rejects article directories without index.md', async (t) => {
  const f = await fixture(t);
  await mkdir(join(f.repository, 'unfinished-note'));
  await writeFile(
    join(f.repository, 'unfinished-note/README.md'),
    '# Unfinished',
  );
  f.commit();
  await assert.rejects(syncNotes(f), /unfinished-note\/index\.md/);
});

test('selected notes snapshot is reused even when remote is unavailable', async (t) => {
  const f = await fixture(t);
  await syncNotes(f);
  await rename(f.repository, `${f.repository}-offline`);
  assert.equal(
    await syncNotes({ ...f, expectedRevision: f.revision }),
    f.revision,
  );
  await assert.rejects(syncNotes(f));
  assert.equal(
    git(join(f.root, '.content/notes'), 'rev-parse', 'HEAD'),
    f.revision,
  );
});

test('notes snapshot must exist and match', async (t) => {
  const f = await fixture(t);
  await assert.rejects(
    syncNotes({ ...f, expectedRevision: f.revision }),
    /snapshot/i,
  );
  await syncNotes(f);
  await assert.rejects(
    syncNotes({ ...f, expectedRevision: '0'.repeat(40) }),
    /snapshot/i,
  );
});

test('notes sync preserves local checkout edits', async (t) => {
  const f = await fixture(t);
  await syncNotes(f);
  const path = join(f.root, '.content/notes/README.md');
  await writeFile(path, 'local edits');
  await assert.rejects(syncNotes(f), /modified/i);
  assert.equal(await readFile(path, 'utf8'), 'local edits');
});

test('invalid note directories and symlinks never replace existing content', async (t) => {
  const f = await fixture(t);
  await syncNotes(f);
  await mkdir(join(f.repository, 'Bad_Name'));
  await writeFile(join(f.repository, 'Bad_Name/index.md'), '# Invalid');
  f.commit();
  await assert.rejects(syncNotes(f), /identifier|directory/i);
  await rm(join(f.repository, 'Bad_Name'), { recursive: true });
  await mkdir(join(f.repository, 'valid-note'));
  await writeFile(join(f.repository, 'valid-note/index.md'), '# Valid');
  await symlink('../README.md', join(f.repository, 'valid-note/linked.md'));
  f.commit();
  await assert.rejects(syncNotes(f), /symbolic|symlink/i);
  assert.equal(
    git(join(f.root, '.content/notes'), 'rev-parse', 'HEAD'),
    f.revision,
  );
});

test('local source validates without creating cache or mutating the source', async (t) => {
  const f = await fixture(t);
  assert.equal(
    await syncNotes({
      ...f,
      localSource: f.repository,
      ci: false,
      production: false,
    }),
    null,
  );
  assert.equal(git(f.repository, 'status', '--porcelain'), '');
  await assert.rejects(readFile(join(f.root, '.content/notes/README.md')), {
    code: 'ENOENT',
  });
  await assert.rejects(
    syncNotes({
      ...f,
      localSource: 'relative/path',
      ci: false,
      production: false,
    }),
    /absolute/i,
  );
  await rm(join(f.repository, 'templates/note.md'));
  await assert.rejects(
    syncNotes({
      ...f,
      localSource: f.repository,
      ci: false,
      production: false,
    }),
    /templates\/note.md/,
  );
});

test('CI and production reject local overrides before accessing sources', async (t) => {
  const f = await fixture(t);
  for (const options of [{ ci: true }, { production: true }]) {
    await assert.rejects(
      syncNotes({ ...f, localSource: '/missing', ...options }),
      /local.*(CI|production)/i,
    );
  }
});
