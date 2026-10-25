import { labIdentifier } from './lab-source.mjs';
export function labUrl(id) {
  if (id !== undefined && !labIdentifier.test(id))
    throw new Error('Invalid lab URL identifier');
  return `/labs/${id === undefined ? '' : id + '/'}`;
}
export function labAssetUrl(id, path) {
  if (!path.split('/').every((p) => /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(p)))
    throw new Error(`Unsafe lab path: ${path}`);
  return (
    labUrl(id) + 'assets/' + path.split('/').map(encodeURIComponent).join('/')
  );
}
export function labPackageUrl(id) {
  return labUrl(id) + 'materiais.zip';
}
