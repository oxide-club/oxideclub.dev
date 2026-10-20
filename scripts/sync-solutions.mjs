import { isAbsolute } from 'node:path';
import { github, repositoryUrl } from '../src/config/github.mjs';
import { loadCommunity } from '../src/lib/community.ts';
import { syncRepository } from './sync-repository.mjs';

export async function syncSolutions({
  localSource = process.env.SOLUTIONS_SOURCE,
  ci = Boolean(process.env.CI && process.env.CI !== 'false'),
  production = process.env.SITE_RELEASE === 'production' ||
    process.env.npm_lifecycle_event === 'build:production',
  ...options
} = {}) {
  if (localSource !== undefined) {
    if (ci || production)
      throw new Error(
        'Local solutions source overrides are forbidden in CI and production',
      );
    if (!isAbsolute(localSource))
      throw new Error('SOLUTIONS_SOURCE must be an absolute path');
    await loadCommunity(localSource);
    return null;
  }
  return syncRepository({
    name: 'solutions',
    branch: github.repositories.solutions.branch,
    repository: `${repositoryUrl('solutions')}.git`,
    snapshotVariable: 'SOLUTIONS_COMMIT',
    validate: loadCommunity,
    ...options,
  });
}
