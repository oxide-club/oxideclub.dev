import { lstat, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { meetingIdentifier } from './meeting-source.mjs';
import { noteAssets } from './note-assets.mjs';

async function regular(directory, path, type) {
  const stat = await lstat(join(directory, path)).catch(() => null);
  if (
    !stat ||
    stat.isSymbolicLink() ||
    !(type === 'directory' ? stat.isDirectory() : stat.isFile())
  )
    throw new Error(`Missing regular meetings ${type}: ${path}`);
}
export async function validateMeetings(directory) {
  await regular(directory, '.', 'directory');
  for (const file of [
    'README.md',
    'CONTRIBUTING.md',
    'LICENSE',
    'templates/meeting.md',
  ])
    await regular(directory, file, 'file');
  for (const name of ['meetings', 'assets', 'templates'])
    await regular(directory, name, 'directory');
  for (const entry of await readdir(join(directory, 'meetings'), {
    withFileTypes: true,
  })) {
    if (entry.name === '.gitkeep' && entry.isFile()) continue;
    if (
      !entry.isFile() ||
      entry.isSymbolicLink() ||
      !entry.name.endsWith('.md') ||
      !meetingIdentifier.test(entry.name.slice(0, -3))
    )
      throw new Error(`Invalid meeting filename: ${entry.name}`);
  }
  for (const entry of await readdir(join(directory, 'assets'), {
    withFileTypes: true,
  })) {
    if (entry.name === '.gitkeep' && entry.isFile()) continue;
    if (
      !entry.isDirectory() ||
      entry.isSymbolicLink() ||
      !meetingIdentifier.test(entry.name)
    )
      throw new Error(`Unsafe meetings asset directory: ${entry.name}`);
    await noteAssets(join(directory, 'assets', entry.name));
  }
}
