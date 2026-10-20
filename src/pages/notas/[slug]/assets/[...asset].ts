import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { publishedNotes } from '../../../../lib/notes';
import { notesDirectory } from '../../../../lib/note-source.mjs';
import { noteAssets, noteAssetType } from '../../../../lib/note-assets.mjs';

export async function getStaticPaths() {
  return (
    await Promise.all(
      (await publishedNotes()).map(async (note) => {
        const directory = join(notesDirectory(), note.id, 'assets');
        return (await noteAssets(directory)).map((asset) => ({
          params: { slug: note.id, asset },
          props: { path: join(directory, asset), type: noteAssetType(asset) },
        }));
      }),
    )
  ).flat();
}
export const GET: APIRoute = async ({ props }) =>
  new Response(new Uint8Array(await readFile(props.path)), {
    headers: {
      'Content-Type': props.type,
      'X-Content-Type-Options': 'nosniff',
    },
  });
