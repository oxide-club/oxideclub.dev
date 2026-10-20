import { lstat, readdir } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { challengeIdentifier } from '../src/lib/challenge-source.mjs';
import { github, repositoryUrl } from '../src/config/github.mjs';
import { syncRepository } from './sync-repository.mjs';

async function validateDefinitions(directory) {
  const numbers = new Set();
  let count = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isDirectory() || !challengeIdentifier.test(entry.name)) continue;
    const definition = await lstat(join(directory, entry.name, 'index.md'));
    if (!definition.isFile() || definition.isSymbolicLink()) {
      throw new Error(`Missing challenge definition: ${entry.name}/index.md`);
    }
    const number = entry.name.split('-')[0];
    if (numbers.has(number))
      throw new Error(`Duplicate challenge number: ${number}`);
    numbers.add(number);
    count++;
  }
  if (!count) throw new Error('No numbered challenge definitions found');
}

export async function syncChallenges({
  localSource = process.env.CHALLENGES_SOURCE,
  ci = Boolean(process.env.CI && process.env.CI !== 'false'),
  production = process.env.SITE_RELEASE === 'production' ||
    process.env.npm_lifecycle_event === 'build:production',
  ...options
} = {}) {
  if (localSource !== undefined) {
    if (ci || production)
      throw new Error(
        'Local challenges source overrides are forbidden in CI and production',
      );
    if (!isAbsolute(localSource))
      throw new Error('CHALLENGES_SOURCE must be an absolute path');
    await validateDefinitions(localSource);
    return null;
  }
  return syncRepository({
    name: 'challenges',
    branch: github.repositories.challenges.branch,
    repository: `${repositoryUrl('challenges')}.git`,
    snapshotVariable: 'CHALLENGES_COMMIT',
    validate: validateDefinitions,
    ...options,
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const revision = await syncChallenges({
      expectedRevision: process.env.CHALLENGES_COMMIT,
      githubEnv: process.env.GITHUB_ENV,
      production:
        process.argv.includes('--production') ||
        process.env.SITE_RELEASE === 'production' ||
        process.env.npm_lifecycle_event === 'build:production',
    });
    console.log(
      revision
        ? `[content] oxide-club/challenges main @ ${revision}`
        : '[content] challenges local source validated',
    );
  } catch (error) {
    console.error(`[content] ${error.message}`);
    process.exitCode = 1;
  }
}
