import { lstat, readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';

export const noteAssetTypes = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.json': 'application/json',
};
/** @param {string} filename */
export function noteAssetType(filename) {
  return noteAssetTypes[extname(filename).toLowerCase()];
}
/** Only explicitly allowed regular files beneath a published note's assets directory.
 * @param {string} directory
 * @param {string} [prefix]
 * @returns {Promise<string[]>}
 */
export async function noteAssets(directory, prefix = '') {
  const stat = await lstat(directory).catch((error) => {
    if (error.code === 'ENOENT' && !prefix) return null;
    throw error;
  });
  if (!stat) return [];
  if (!stat.isDirectory() || stat.isSymbolicLink())
    throw new Error(`Unsafe note asset directory: ${directory}`);
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (
      !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(entry.name) ||
      entry.isSymbolicLink()
    )
      throw new Error(`Unsafe note asset: ${entry.name}`);
    const relative = prefix + entry.name;
    if (entry.isDirectory())
      result.push(
        ...(await noteAssets(join(directory, entry.name), `${relative}/`)),
      );
    else if (entry.isFile() && noteAssetType(entry.name)) result.push(relative);
    else throw new Error(`Unsupported note asset: ${relative}`);
  }
  return result;
}
