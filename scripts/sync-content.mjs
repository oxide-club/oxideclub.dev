import { syncSolutions } from './sync-solutions.mjs';
import { syncChallenges } from './sync-challenges.mjs';
import { syncNotes } from './sync-notes.mjs';
import { syncMeetings } from './sync-meetings.mjs';

try {
  const production =
    process.argv.includes('--production') ||
    process.env.SITE_RELEASE === 'production' ||
    process.env.npm_lifecycle_event === 'build:production';
  if (
    (process.env.CHALLENGES_SOURCE !== undefined ||
      process.env.SOLUTIONS_SOURCE !== undefined ||
      process.env.NOTES_SOURCE !== undefined ||
      process.env.MEETINGS_SOURCE !== undefined) &&
    (production || (process.env.CI && process.env.CI !== 'false'))
  ) {
    throw new Error(
      'Local content source overrides are forbidden in CI and production',
    );
  }
  const challenges = await syncChallenges({
    expectedRevision: process.env.CHALLENGES_COMMIT,
    production,
    githubEnv: process.env.GITHUB_ENV,
  });
  console.log(
    challenges
      ? `[content] oxide-club/challenges main @ ${challenges}`
      : '[content] challenges local source validated',
  );
  const solutions = await syncSolutions({
    expectedRevision: process.env.SOLUTIONS_COMMIT,
    githubEnv: process.env.GITHUB_ENV,
    production,
  });
  console.log(
    solutions
      ? `[content] oxide-club/solutions main @ ${solutions}`
      : '[content] solutions local source validated',
  );
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
  const meetings = await syncMeetings({
    expectedRevision: process.env.MEETINGS_COMMIT,
    githubEnv: process.env.GITHUB_ENV,
    production,
  });
  console.log(
    meetings
      ? `[content] oxide-club/meetings main @ ${meetings}`
      : '[content] meetings local source validated',
  );
} catch (error) {
  console.error(`[content] ${error.message}`);
  process.exitCode = 1;
}
