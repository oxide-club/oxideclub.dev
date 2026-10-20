import { lstat, readdir } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { github, repositoryUrl } from '../src/config/github.mjs';
import {
  noteIdentifier,
  reservedNoteDirectories,
} from '../src/lib/note-source.mjs';
import { syncRepository } from './sync-repository.mjs';

async function regularFile(directory, path) {
  const stat = await lstat(join(directory, path)).catch(() => null);
  if (!stat?.isFile() || stat.isSymbolicLink()) {
    throw new Error(`Missing regular notes file: ${path}`);
  }
}

async function rejectSymlinks(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink())
      throw new Error(
        `Symbolic links are not allowed in note trees: ${entry.name}`,
      );
    if (entry.isDirectory()) await rejectSymlinks(join(directory, entry.name));
  }
}

export async function validateNotes(directory) {
  const stat = await lstat(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink())
    throw new Error('Notes source must be a regular directory');
  for (const path of [
    'README.md',
    'CONTRIBUTING.md',
    'LICENSE',
    'templates/note.md',
  ]) {
    await regularFile(directory, path);
  }
  const templates = await lstat(join(directory, 'templates'));
  if (!templates.isDirectory() || templates.isSymbolicLink())
    throw new Error('Notes templates must be a regular directory');
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || reservedNoteDirectories.has(entry.name))
      continue;
    if (entry.isSymbolicLink())
      throw new Error(`Symbolic links are not allowed in notes: ${entry.name}`);
    if (!entry.isDirectory()) continue;
    const definition = await lstat(
      join(directory, entry.name, 'index.md'),
    ).catch((error) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (!definition && !noteIdentifier.test(entry.name)) continue;
    if (!noteIdentifier.test(entry.name))
      throw new Error(`Invalid note directory identifier: ${entry.name}`);
    await regularFile(directory, `${entry.name}/index.md`);
    await rejectSymlinks(join(directory, entry.name));
  }
}

export async function syncNotes({
  localSource = process.env.NOTES_SOURCE,
  ci = Boolean(process.env.CI && process.env.CI !== 'false'),
  production = process.env.SITE_RELEASE === 'production' ||
    process.env.npm_lifecycle_event === 'build:production',
  ...options
} = {}) {
  if (localSource !== undefined) {
    if (ci || production)
      throw new Error(
        'Local notes source overrides are forbidden in CI and production',
      );
    if (!isAbsolute(localSource))
      throw new Error('NOTES_SOURCE must be an absolute path');
    await validateNotes(localSource);
    return null;
  }
  return syncRepository({
    name: 'notes',
    branch: github.repositories.notes.branch,
    repository: `${repositoryUrl('notes')}.git`,
    snapshotVariable: 'NOTES_COMMIT',
    validate: validateNotes,
    ...options,
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const revision = await syncNotes({
      expectedRevision: process.env.NOTES_COMMIT,
      githubEnv: process.env.GITHUB_ENV,
      production:
        process.argv.includes('--production') ||
        process.env.SITE_RELEASE === 'production' ||
        process.env.npm_lifecycle_event === 'build:production',
    });
    console.log(
      revision
        ? `[content] oxide-club/notes main @ ${revision}`
        : '[content] notes local source validated',
    );
  } catch (error) {
    console.error(`[content] ${error.message}`);
    process.exitCode = 1;
  }
}
