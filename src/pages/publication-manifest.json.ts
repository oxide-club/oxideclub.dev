import type { APIRoute } from 'astro';
import { publishedChallenges } from '../lib/challenges';
import { publishedNotes } from '../lib/notes';
import { createManifest } from '../lib/publication-manifest.mjs';
import { site } from '../config/site';
export const GET: APIRoute = async () =>
  new Response(
    JSON.stringify(
      createManifest({
        challenges: await publishedChallenges(),
        notes: await publishedNotes(),
        revisions: {
          challenges: process.env.CHALLENGES_COMMIT,
          notes: process.env.NOTES_COMMIT,
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
