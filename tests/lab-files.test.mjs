import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { labFiles, resolveLabFile } from '../src/lib/lab-files.mjs';
test('distribution excludes artifacts and refuses traversal and symlinks', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'lab-files-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(join(dir, 'materials'));
  await writeFile(join(dir, 'index.md'), 'intro');
  await writeFile(join(dir, 'materials/trace.txt'), 'L 0x0');
  await writeFile(join(dir, 'materials/cache'), 'binary');
  await writeFile(join(dir, '.secret'), 'no');
  assert.deepEqual(
    (await labFiles(dir)).map((f) => f.path),
    ['index.md', 'materials/trace.txt'],
  );
  for (const path of [
    '../index.md',
    '/tmp/a',
    'materials/%2e%2e/a',
    'materials/cache',
  ])
    await assert.rejects(resolveLabFile(dir, path));
  await symlink('/tmp', join(dir, 'materials/escape'));
  await assert.rejects(labFiles(dir), /Unsafe/);
});
