import type { APIRoute } from 'astro';
import { availableLabs } from '../../../lib/labs';
import { labsDirectory } from '../../../lib/lab-source.mjs';
import { createLabPackage, labRevision } from '../../../lib/lab-package.mjs';
export async function getStaticPaths() {
  return (await availableLabs()).map((lab) => ({ params: { slug: lab.id } }));
}
export const GET: APIRoute = async ({ params }) => {
  const sourceDirectory = labsDirectory();
  const bytes = await createLabPackage({
    sourceDirectory,
    id: params.slug!,
    revision: await labRevision(sourceDirectory),
  });
  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${params.slug}-materiais.zip"`,
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
