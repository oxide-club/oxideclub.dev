import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { publishedMeetings } from '../../../../lib/meetings';
import { meetingsDirectory } from '../../../../lib/meeting-source.mjs';
import { noteAssets } from '../../../../lib/note-assets.mjs';
import { meetingAsset } from '../../../../lib/meeting-assets.mjs';
export async function getStaticPaths() {
  return (
    await Promise.all(
      (await publishedMeetings()).map(async ({ id }) =>
        (await noteAssets(join(meetingsDirectory(), 'assets', id))).map(
          (asset) => ({
            params: { id, asset },
            props: meetingAsset(id, `../assets/${id}/${asset}`),
          }),
        ),
      ),
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
