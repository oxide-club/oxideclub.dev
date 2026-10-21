import { lstat, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'astro/zod';

/** @typedef {{id: string, slug: string, title: string, description: string}} Area */
const key = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const challengeAreasSchema = z
  .array(
    z.object({
      id: key,
      slug: key,
      title: z.string().trim().min(1),
      description: z.string().trim().min(1),
    }),
  )
  .min(1)
  .refine(
    (areas) =>
      new Set(areas.map((a) => a.id)).size === areas.length &&
      new Set(areas.map((a) => a.slug)).size === areas.length,
    'Area IDs and slugs must be unique',
  );

/** @param {string} directory @returns {Promise<Area[]>} */
export async function loadChallengeAreas(directory) {
  const path = join(directory, 'areas.json');
  try {
    const stat = await lstat(path);
    if (!stat.isFile() || stat.isSymbolicLink())
      throw new Error('Use a regular registry file');
    return challengeAreasSchema.parse(JSON.parse(await readFile(path, 'utf8')));
  } catch (error) {
    throw new Error(
      `${path}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/** @param {unknown} area @param {Area[]} areas @param {string} identifier @returns {string} */
export function validateChallengeArea(area, areas, identifier) {
  if (typeof area !== 'string' || !areas.some((entry) => entry.id === area)) {
    throw new Error(
      `${identifier}: area must reference one known ID in areas.json`,
    );
  }
  return area;
}
