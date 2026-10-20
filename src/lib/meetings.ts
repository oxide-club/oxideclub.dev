import { getCollection } from 'astro:content';
import { descendingMeetings, meetingsDirectory } from './meeting-source.mjs';
import { validateMeetings } from './meeting-files.mjs';
import { meetingMaterialUrl } from './meeting-assets.mjs';

export async function publishedMeetings() {
  await validateMeetings(meetingsDirectory());
  const entries = await getCollection('meetings');
  // Validate frontmatter asset references even for drafts, as for Markdown links.
  for (const { id, data } of entries)
    for (const material of data.materials) meetingMaterialUrl(id, material.url);
  return descendingMeetings(entries.filter(({ data }) => !data.draft));
}
