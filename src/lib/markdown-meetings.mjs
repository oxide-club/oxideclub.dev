import { fileURLToPath } from 'node:url';
import { relative, isAbsolute, join } from 'node:path';
import { meetingsDirectory, meetingIdentifier } from './meeting-source.mjs';
import { meetingAsset } from './meeting-assets.mjs';

export default function markdownMeetings({ fileURL }) {
  if (!fileURL) return;
  const file = fileURLToPath(fileURL);
  const path = relative(join(meetingsDirectory(), 'meetings'), file).replaceAll(
    '\\',
    '/',
  );
  const id = path.slice(0, -3);
  if (isAbsolute(path) || !path.endsWith('.md') || !meetingIdentifier.test(id))
    return;
  const fail = (message) => {
    throw new Error(`${file}: ${message}`);
  };
  const visit = (node, context) => {
    if (node.type === 'html')
      fail('Meetings do not allow raw HTML. Use Markdown.');
    if (
      (node.type === 'image' || node.type === 'imageReference') &&
      !node.alt?.trim()
    )
      fail('Meeting images require descriptive alternative text.');
    if (node.url === undefined) return;
    const url = node.url;
    if (
      /^(?:https?:|mailto:)/i.test(url) ||
      url.startsWith('#') ||
      (url.startsWith('/') && !url.startsWith('//'))
    )
      return;
    if (url.startsWith('../assets/')) {
      context.setProperty(node, 'url', meetingAsset(id, url).url);
      return;
    }
    const match =
      /^(?:\.\/)?((?!000-)[0-9]{3,}-[a-z0-9]+(?:-[a-z0-9]+)*)\.md(#[^\s]*)?$/.exec(
        url,
      );
    if (match)
      context.setProperty(
        node,
        'url',
        `/encontros/${match[1]}/${match[2] || ''}`,
      );
    else
      fail(
        `Unsupported meeting URL: ${url}. Use HTTPS, a site path, ../assets/${id}/file, or ./NNN-meeting.md.`,
      );
  };
  return {
    name: 'oxide-meetings',
    html: visit,
    image: visit,
    imageReference: visit,
    link: visit,
    definition: visit,
  };
}
