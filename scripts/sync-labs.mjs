import { parseDocument } from 'yaml';
import { loadAreas, validateArea } from '../src/lib/content-areas.mjs';
import { lstat, readdir, readFile } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { github, repositoryUrl } from '../src/config/github.mjs';
import { labIdentifier } from '../src/lib/lab-source.mjs';
import { syncRepository } from './sync-repository.mjs';

const reservedLabDirectories = new Set([
  'templates',
  'scripts',
  'tests',
  'docs',
  'licenses',
]);

async function regularFile(directory, path) {
  const stat = await lstat(join(directory, path)).catch(() => null);
  if (!stat?.isFile() || stat.isSymbolicLink()) {
    throw new Error(`Missing regular labs file: ${path}`);
  }
}

async function rejectSymlinks(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink())
      throw new Error(
        `Symbolic links are not allowed in lab trees: ${entry.name}`,
      );
    if (entry.isDirectory()) await rejectSymlinks(join(directory, entry.name));
  }
}

export async function validateLabs(directory) {
  const stat = await lstat(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink())
    throw new Error('Labs source must be a regular directory');
  for (const path of [
    'README.md',
    'CONTRIBUTING.md',
    'LICENSING.md',
    'licenses/MIT.txt',
    'licenses/CC-BY-4.0.txt',
    'licenses/CC0-1.0.txt',
    'templates/index.md',
    'templates/report-template.md',
  ]) {
    await regularFile(directory, path);
  }
  const areas = await loadAreas(directory);
  const templates = await lstat(join(directory, 'templates'));
  if (!templates.isDirectory() || templates.isSymbolicLink())
    throw new Error('Labs templates must be a regular directory');
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || reservedLabDirectories.has(entry.name))
      continue;
    if (entry.isSymbolicLink())
      throw new Error(`Symbolic links are not allowed in labs: ${entry.name}`);
    if (!entry.isDirectory()) continue;
    const definition = await lstat(
      join(directory, entry.name, 'index.md'),
    ).catch((error) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (!definition && !labIdentifier.test(entry.name)) continue;
    if (!labIdentifier.test(entry.name))
      throw new Error(`Invalid note directory identifier: ${entry.name}`);
    await regularFile(directory, `${entry.name}/index.md`);
    const path = join(directory, entry.name, 'index.md');
    const text = await readFile(path, 'utf8');
    const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!frontmatter) throw new Error(`${path}: missing frontmatter`);
    const document = parseDocument(frontmatter[1]);
    if (document.errors.length)
      throw new Error(`${path}: ${document.errors[0].message}`);
    validateArea(document.toJS()?.area, areas, path);
    await rejectSymlinks(join(directory, entry.name));
  }
}

export async function syncLabs({
  localSource = process.env.LABS_SOURCE,
  ci = Boolean(process.env.CI && process.env.CI !== 'false'),
  production = process.env.SITE_RELEASE === 'production' ||
    process.env.npm_lifecycle_event === 'build:production',
  ...options
} = {}) {
  if (localSource !== undefined) {
    if (ci || production)
      throw new Error(
        'Local labs source overrides are forbidden in CI and production',
      );
    if (!isAbsolute(localSource))
      throw new Error('LABS_SOURCE must be an absolute path');
    await validateLabs(localSource);
    return null;
  }
  return syncRepository({
    name: 'labs',
    branch: github.repositories.labs.branch,
    repository: `${repositoryUrl('labs')}.git`,
    snapshotVariable: 'LABS_COMMIT',
    validate: validateLabs,
    ...options,
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const revision = await syncLabs({
      expectedRevision: process.env.LABS_COMMIT,
      githubEnv: process.env.GITHUB_ENV,
      production:
        process.argv.includes('--production') ||
        process.env.SITE_RELEASE === 'production' ||
        process.env.npm_lifecycle_event === 'build:production',
    });
    console.log(
      revision
        ? `[content] oxide-club/labs main @ ${revision}`
        : '[content] labs local source validated',
    );
  } catch (error) {
    console.error(`[content] ${error.message}`);
    process.exitCode = 1;
  }
}
