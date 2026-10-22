import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { zipSync, strToU8 } from 'fflate';
import { labFiles, assertRegularPath } from './lab-files.mjs';
import { labIdentifier } from './lab-source.mjs';
const exec = promisify(execFile);
export async function labRevision(sourceDirectory) {
  if (process.env.LABS_SOURCE !== undefined) return 'local-preview';
  const { stdout } = await exec('git', [
    '-C',
    sourceDirectory,
    'rev-parse',
    'HEAD',
  ]);
  if (!/^[a-f0-9]{40}$/.test(stdout.trim()))
    throw new Error('Missing synchronized labs revision');
  return stdout.trim();
}
export async function createLabPackage({ sourceDirectory, id, revision }) {
  if (
    !labIdentifier.test(id) ||
    !(revision === 'local-preview' || /^[a-f0-9]{40}$/.test(revision))
  )
    throw new Error('Invalid lab package identifier or revision');
  const entries = {};
  const files = await labFiles(join(sourceDirectory, id));
  for (const path of [
    'LICENSING.md',
    'licenses/MIT.txt',
    'licenses/CC-BY-4.0.txt',
    'licenses/CC0-1.0.txt',
  ])
    files.push({
      path,
      absolutePath: await assertRegularPath(join(sourceDirectory, path)),
    });
  for (const file of files.sort((a, b) => (a.path < b.path ? -1 : 1)))
    entries[`${id}/${file.path}`] = new Uint8Array(
      await readFile(file.absolutePath),
    );
  entries[`${id}/SOURCE.txt`] = strToU8(
    `Oxide Club\nLaboratório: ${id}\nRevisão: ${revision}\n`,
  );
  return zipSync(entries, {
    level: 6,
    mtime: new Date(2000, 0, 1, 0, 0, 0),
    os: 3,
    attrs: 0o100644 << 16,
  });
}
