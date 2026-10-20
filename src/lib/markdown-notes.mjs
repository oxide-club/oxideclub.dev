import { fileURLToPath } from 'node:url';
import { relative, isAbsolute, resolve, dirname } from 'node:path';
import { existsSync, lstatSync } from 'node:fs';
import { notesDirectory, noteIdentifier } from './note-source.mjs';
import { noteAssetType } from './note-assets.mjs';

// Notes accept Markdown, not embedded HTML or executable content. Other collections retain their existing behavior.
export default function markdownNotes({ fileURL }) {
  if (!fileURL) return;
  const file = { path: fileURLToPath(fileURL) };
  const path = relative(notesDirectory(), file.path).replaceAll('\\', '/');
  if (path.startsWith('../') || isAbsolute(path) || !path.endsWith('/index.md'))
    return;
  const id = path.split('/')[0];
  function fail(message) {
    throw new Error(`${file.path}: ${message}`);
  }
  function visit(node, context) {
    if (node.type === 'html')
      fail(
        'Notes do not allow raw HTML. Use Markdown for images, links, and diagrams.',
      );
    if (
      (node.type === 'image' || node.type === 'imageReference') &&
      !node.alt?.trim()
    )
      fail('Note images require descriptive alternative text.');
    if (node.url !== undefined) {
      const url = node.url;
      if (
        /^(?:https?:|mailto:)/i.test(url) ||
        url.startsWith('#') ||
        (url.startsWith('/') && !url.startsWith('//'))
      ) {
        // Explicit web URLs and site/heading links remain ordinary Markdown links.
      } else if (/^(?:\.\/)?assets\//.test(url)) {
        const relativeUrl = url.replace(/^\.\//, '');
        const asset = relativeUrl.split(/[?#]/, 1)[0];
        const suffix = relativeUrl.slice(asset.length);
        if (
          asset
            .split('/')
            .some((part) => !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(part)) ||
          !noteAssetType(asset)
        )
          fail(`Unsupported note asset URL: ${url}`);
        const destination = resolve(dirname(file.path), asset);
        if (
          !existsSync(destination) ||
          !lstatSync(destination).isFile() ||
          lstatSync(destination).isSymbolicLink()
        )
          fail(`Missing or unsafe note asset: ${url}`);
        context.setProperty(node, 'url', `/notas/${id}/${asset}${suffix}`);
      } else {
        const match =
          /^\.\.\/([a-z0-9]+(?:-[a-z0-9]+)*)\/index\.md(#[^\s]*)?$/.exec(url);
        if (match && noteIdentifier.test(match[1]))
          context.setProperty(
            node,
            'url',
            `/notas/${match[1]}/${match[2] || ''}`,
          );
        else
          fail(
            `Unsupported note URL: ${url}. Use HTTPS, a site path, ./assets/file, or ../note-id/index.md.`,
          );
      }
    }
  }
  return {
    name: 'oxide-notes',
    html: visit,
    image: visit,
    imageReference: visit,
    link: visit,
    definition: visit,
  };
}
