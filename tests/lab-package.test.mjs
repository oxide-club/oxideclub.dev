import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, utimes, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { unzipSync, strFromU8 } from 'fflate';
import { createLabPackage } from '../src/lib/lab-package.mjs';
test('packages preserve source, licenses and revision independent of timestamps', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'lab-package-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, '001-test'));
  await mkdir(join(root, 'licenses'));
  await writeFile(join(root, '001-test/index.md'), 'roteiro');
  await writeFile(join(root, 'LICENSING.md'), 'licenças');
  for (const name of ['MIT', 'CC-BY-4.0', 'CC0-1.0'])
    await writeFile(join(root, 'licenses', name + '.txt'), name);
  const options = {
    sourceDirectory: root,
    id: '001-test',
    revision: 'local-preview',
  };
  const a = await createLabPackage(options);
  await utimes(join(root, '001-test/index.md'), 123456, 123456);
  const b = await createLabPackage(options);
  assert.deepEqual(a, b);
  const files = unzipSync(a);
  assert.equal(strFromU8(files['001-test/index.md']), 'roteiro');
  assert.match(strFromU8(files['001-test/SOURCE.txt']), /local-preview/);
  assert.ok(files['001-test/licenses/MIT.txt']);
  await assert.rejects(createLabPackage({ ...options, id: '../secret' }));
});
