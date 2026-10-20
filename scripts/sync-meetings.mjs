import { isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { github, repositoryUrl } from '../src/config/github.mjs';
import { validateMeetings } from '../src/lib/meeting-files.mjs';
export { validateMeetings };
import { syncRepository } from './sync-repository.mjs';

export async function syncMeetings({
  localSource = process.env.MEETINGS_SOURCE,
  ci = Boolean(process.env.CI && process.env.CI !== 'false'),
  production = process.env.SITE_RELEASE === 'production' ||
    process.env.npm_lifecycle_event === 'build:production',
  ...options
} = {}) {
  if (localSource !== undefined) {
    if (ci || production)
      throw new Error(
        'Local meetings source overrides are forbidden in CI and production',
      );
    if (!isAbsolute(localSource))
      throw new Error('MEETINGS_SOURCE must be an absolute path');
    await validateMeetings(localSource);
    return null;
  }
  return syncRepository({
    name: 'meetings',
    branch: github.repositories.meetings.branch,
    repository: `${repositoryUrl('meetings')}.git`,
    snapshotVariable: 'MEETINGS_COMMIT',
    validate: validateMeetings,
    ...options,
  });
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const revision = await syncMeetings({
      expectedRevision: process.env.MEETINGS_COMMIT,
      githubEnv: process.env.GITHUB_ENV,
      production:
        process.argv.includes('--production') ||
        process.env.SITE_RELEASE === 'production' ||
        process.env.npm_lifecycle_event === 'build:production',
    });
    console.log(
      revision
        ? `[content] oxide-club/meetings main @ ${revision}`
        : '[content] meetings local source validated',
    );
  } catch (error) {
    console.error(`[content] ${error.message}`);
    process.exitCode = 1;
  }
}
