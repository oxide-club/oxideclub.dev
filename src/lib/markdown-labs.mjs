import { fileURLToPath } from 'node:url';
import { relative, isAbsolute, dirname } from 'node:path';
import { labsDirectory } from './lab-source.mjs';
import { validateLabHeadings } from './lab-structure.mjs';
import { labAssetUrl } from './lab-urls.mjs';
import { resolveLabFile } from './lab-files.mjs';
const plain = (node) => node.value ?? (node.children ?? []).map(plain).join('');
export default function markdownLabs({ fileURL }) {
  if (!fileURL) return;
  const file = fileURLToPath(fileURL);
  const path = relative(labsDirectory(), file).replaceAll('\\', '/');
  if (path.startsWith('../') || isAbsolute(path) || !path.endsWith('/index.md'))
    return;
  const id = path.split('/')[0];
  const headings = [];
  let details = false,
    summary = false;
  const fail = (message) => {
    throw new Error(`${file}: ${message}`);
  };
  async function link(node, context) {
    if (
      (node.type === 'image' || node.type === 'imageReference') &&
      !node.alt?.trim()
    )
      fail('Images require alternative text');
    if (node.url === undefined) return;
    const url = node.url;
    if (
      /^(?:https?:|mailto:)/i.test(url) ||
      url.startsWith('#') ||
      (url.startsWith('/') && !url.startsWith('//'))
    )
      return;
    const local = url.replace(/^\.\//, '');
    const [asset] = local.split(/[?#]/, 1);
    const suffix = local.slice(asset.length);
    const target = labAssetUrl(id, asset);
    await resolveLabFile(dirname(file), asset);
    context.setProperty(node, 'url', target + suffix);
  }
  return {
    name: 'oxide-labs',
    heading(node) {
      if (node.depth === 2) headings.push(plain(node));
    },
    html(node) {
      let value = node.value.trim();
      while (value) {
        if (value.startsWith('<details>') && !details) {
          details = true;
          summary = false;
          value = value.slice(9).trim();
        } else if (value.startsWith('<summary>') && details && !summary) {
          const match = /^<summary>([^<>]+)<\/summary>/.exec(value);
          if (!match || !match[1].trim())
            fail('A nonempty summary is required');
          summary = true;
          value = value.slice(match[0].length).trim();
        } else if (value.startsWith('</details>') && details && summary) {
          details = false;
          value = value.slice(10).trim();
        } else
          fail(
            'HTML is limited to balanced details with a nonempty summary and no attributes',
          );
      }
    },
    link,
    definition: link,
    image: link,
    imageReference: link,
    after() {
      validateLabHeadings(headings, file);
      if (details) fail('Unclosed details HTML');
    },
  };
}
