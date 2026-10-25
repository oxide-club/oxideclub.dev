import type { APIRoute } from 'astro';
import { publishedChallenges } from '../lib/challenges';
import { publishedNotes } from '../lib/notes';
import { publishedLabs } from '../lib/labs';
import { createManifest } from '../lib/publication-manifest.mjs';
import { publicationRevisions } from '../lib/publication-revisions.mjs';
import { site } from '../config/site';
export const GET: APIRoute = async () =>
  new Response(
    JSON.stringify(
      createManifest({
        challenges: await publishedChallenges(),
        notes: await publishedNotes(),
        labs: await publishedLabs(),
        revisions: site.production
          ? await publicationRevisions({
              revisions: {
                challenges: process.env.CHALLENGES_COMMIT,
                notes: process.env.NOTES_COMMIT,
                labs: process.env.LABS_COMMIT,
              },
            })
          : {
              challenges: process.env.CHALLENGES_COMMIT,
              notes: process.env.NOTES_COMMIT,
              labs: process.env.LABS_COMMIT,
            },
        production: site.production,
      }),
    ),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    },
  );
