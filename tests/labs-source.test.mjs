import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, mkdtemp, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { syncLabs, validateLabs } from '../scripts/sync-labs.mjs';
test('local labs validate without remote access and reject unsafe trees', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'labs-source-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const dir of [
    'templates',
    'licenses',
    '005-cache-lab/materials',
  ])
    await mkdir(join(root, dir), { recursive: true });
  for (const file of [
    'README.md',
    'CONTRIBUTING.md',
    'LICENSING.md',
    'licenses/MIT.txt',
    'licenses/CC-BY-4.0.txt',
    'licenses/CC0-1.0.txt',
    'templates/index.md',
    'templates/report-template.md',
    '005-cache-lab/index.md',
  ])
    await writeFile(join(root, file), 'fixture');
  assert.equal(
    await syncLabs({ localSource: root, ci: false, production: false }),
    null,
  );
  await assert.rejects(syncLabs({ localSource: root, ci: true }), /forbidden/);
  await symlink('/tmp', join(root, '005-cache-lab/materials/escape'));
  await assert.rejects(validateLabs(root), /Symbolic/);
});
