import { join } from 'node:path';
import { lstatSync } from 'node:fs';
import { meetingsDirectory } from './meeting-source.mjs';
import { noteAssetType } from './note-assets.mjs';

/** Resolve only a meeting's own regular assets; reject symlink ancestors too. */
export function meetingAsset(id, url) {
  if (!url.startsWith(`../assets/${id}/`))
    throw new Error(`Meeting ${id} may reference only its own assets: ${url}`);
  const path = url.slice(`../assets/${id}/`.length);
  if (
    !path ||
    path
      .split('/')
      .some((part) => !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(part)) ||
    !noteAssetType(path)
  )
    throw new Error(`Unsupported meeting asset URL: ${url}`);
  let destination = meetingsDirectory();
  const parts = ['assets', id, ...path.split('/')];
  for (let index = 0; index < parts.length; index++) {
    destination = join(destination, parts[index]);
    let stat;
    try {
      stat = lstatSync(destination);
    } catch {
      throw new Error(`Missing meeting asset: ${url}`);
    }
    if (
      stat.isSymbolicLink() ||
      (index === parts.length - 1 ? !stat.isFile() : !stat.isDirectory())
    )
      throw new Error(`Unsafe meeting asset: ${url}`);
  }
  return {
    url: `/encontros/${id}/assets/${path}`,
    path: destination,
    type: noteAssetType(path),
  };
}
export function meetingMaterialUrl(id, url) {
  return url.startsWith('../assets/') ? meetingAsset(id, url).url : url;
}
