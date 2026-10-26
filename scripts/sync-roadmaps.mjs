import { lstat, readdir } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { github, repositoryUrl } from '../src/config/github.mjs';
import {
  roadmapIdentifier,
  reservedRoadmapDirectories,
} from '../src/lib/roadmap-source.mjs';
import { syncRepository } from './sync-repository.mjs';
async function regular(directory, path) {
  const stat = await lstat(join(directory, path)).catch(() => null);
  if (!stat?.isFile() || stat.isSymbolicLink())
    throw new Error(`Arquivo regular obrigatório: ${path}`);
}
export async function validateRoadmaps(directory) {
  const stat = await lstat(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink())
    throw new Error('A fonte deve ser um diretório regular');
  for (const path of [
    'README.md',
    'CONTRIBUTING.md',
    'LICENSING.md',
    'roadmap.schema.json',
    'templates/index.md',
  ])
    await regular(directory, path);
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (
      entry.name.startsWith('.') ||
      reservedRoadmapDirectories.has(entry.name)
    )
      continue;
    if (entry.isSymbolicLink())
      throw new Error(`Link simbólico não permitido: ${entry.name}`);
    if (!entry.isDirectory()) continue;
    if (!roadmapIdentifier.test(entry.name))
      throw new Error(`Identificador de trilha inválido: ${entry.name}`);
    await regular(directory, `${entry.name}/index.md`);
  }
}
export async function syncRoadmaps(options = {}) {
  const {
    ci = Boolean(process.env.CI && process.env.CI !== 'false'),
    production = process.env.SITE_RELEASE === 'production' ||
      process.env.npm_lifecycle_event === 'build:production',
    ...rest
  } = options;
  const localSource = Object.hasOwn(options, 'localSource')
    ? options.localSource
    : process.env.ROADMAPS_SOURCE;
  delete rest.localSource;
  if (localSource !== undefined) {
    if (ci || production)
      throw new Error(
        'Local roadmaps source overrides are forbidden in CI and production',
      );
    if (!isAbsolute(localSource))
      throw new Error('ROADMAPS_SOURCE must be an absolute path');
    await validateRoadmaps(localSource);
    return null;
  }
  return syncRepository({
    name: 'roadmaps',
    branch: github.repositories.roadmaps.branch,
    repository: `${repositoryUrl('roadmaps')}.git`,
    snapshotVariable: 'ROADMAPS_COMMIT',
    validate: validateRoadmaps,
    ...rest,
  });
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const revision = await syncRoadmaps({
      expectedRevision: process.env.ROADMAPS_COMMIT,
      production:
        process.argv.includes('--production') ||
        process.env.SITE_RELEASE === 'production',
      githubEnv: process.env.GITHUB_ENV,
    });
    console.log(
      revision
        ? `[content] oxide-club/roadmaps main @ ${revision}`
        : '[content] roadmaps local source validated',
    );
  } catch (error) {
    console.error(`[content] ${error.message}`);
    process.exitCode = 1;
  }
}
