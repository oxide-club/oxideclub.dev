import { syncChallenges } from './sync-challenges.mjs';
import { syncNotes } from './sync-notes.mjs';

try {
  const production =
    process.argv.includes('--production') ||
    process.env.SITE_RELEASE === 'production' ||
    process.env.npm_lifecycle_event === 'build:production';
  if (
    process.env.NOTES_SOURCE !== undefined &&
    (production || (process.env.CI && process.env.CI !== 'false'))
  ) {
    throw new Error(
      'Local notes source overrides are forbidden in CI and production',
    );
  }
  const challenges = await syncChallenges({
    expectedRevision: process.env.CHALLENGES_COMMIT,
    githubEnv: process.env.GITHUB_ENV,
  });
  console.log(`[content] oxide-club/challenges main @ ${challenges}`);
  const notes = await syncNotes({
    expectedRevision: process.env.NOTES_COMMIT,
    githubEnv: process.env.GITHUB_ENV,
    production,
  });
  console.log(
    notes
      ? `[content] oxide-club/notes main @ ${notes}`
      : '[content] notes local source validated',
  );
} catch (error) {
  console.error(`[content] ${error.message}`);
  process.exitCode = 1;
}
