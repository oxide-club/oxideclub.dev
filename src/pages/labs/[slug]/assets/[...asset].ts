import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { availableLabs } from '../../../../lib/labs';
import { labsDirectory } from '../../../../lib/lab-source.mjs';
import { labFiles } from '../../../../lib/lab-files.mjs';
export async function getStaticPaths() {
  return (
    await Promise.all(
      (await availableLabs()).map(async (lab) =>
        (await labFiles(join(labsDirectory(), lab.id))).map((file) => ({
          params: { slug: lab.id, asset: file.path },
          props: { file },
        })),
      ),
    )
  ).flat();
}
export const GET: APIRoute = async ({ props }) =>
  new Response(new Uint8Array(await readFile(props.file.absolutePath)), {
    headers: {
      'Content-Type': props.file.type,
      'X-Content-Type-Options': 'nosniff',
    },
  });
