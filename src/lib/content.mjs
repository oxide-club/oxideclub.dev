/** @template {{data: {draft: boolean, featured?: boolean, slug: string}}} T @param {T[]} entries @returns {T[]} */
export function selectPublished(entries) {
  const published = entries.filter((entry) => !entry.data.draft);
  if (
    new Set(published.map((entry) => entry.data.slug)).size !== published.length
  )
    throw new Error('Duplicate publication slug');
  return published;
}
/** @param {Record<string, string | null>} links */
export function validateLinks(links) {
  for (const [key, value] of Object.entries(links)) {
    if (!value) continue;
    const url = new URL(value);
    if (url.username || url.password)
      throw new Error(`Credentials forbidden in ${key}`);
    if (
      (key === 'reporting' || key === 'backupReporting') &&
      url.protocol === 'mailto:' &&
      /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(url.pathname)
    )
      continue;
    if (url.protocol !== 'https:')
      throw new Error(`Invalid protocol for ${key}`);
    if (
      key === 'discord' &&
      !['discord.gg', 'discord.com'].includes(url.hostname)
    )
      throw new Error('Invalid Discord host');
    if (key === 'github' && url.hostname !== 'github.com')
      throw new Error('Invalid GitHub host');
    if (url.pathname === '/') throw new Error(`Missing destination for ${key}`);
  }
  return links;
}
