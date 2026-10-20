const origin = 'https://oxideclub.dev';
export function publicationUrl(type, id) {
  const pattern = type === 'challenge' ? /^\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*$/ : /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!['challenge', 'note'].includes(type) || !pattern.test(id) || ['templates', 'docs'].includes(id)) throw new Error('Invalid publication identifier');
  return `${origin}/${type === 'challenge' ? 'desafios' : 'notas'}/${id}`;
}
export function validateManifest(manifest, { requireProduction = true } = {}) {
  if (!manifest || manifest.version !== 1 || !Array.isArray(manifest.entries) || typeof manifest.production !== 'boolean') throw new Error('Invalid publication manifest');
  if (requireProduction && !manifest.production) throw new Error('A production manifest is required');
  if (!manifest.revisions || (manifest.production && ['challenges', 'notes'].some(kind => !/^[a-f0-9]{40}$/.test(manifest.revisions[kind])))) throw new Error('Invalid publication revisions');
  const keys = new Set();
  for (const entry of manifest.entries) {
    if (entry.url !== publicationUrl(entry.type, entry.id)) throw new Error('Invalid publication URL');
    if (typeof entry.title !== 'string' || !entry.title.trim() || typeof entry.summary !== 'string' || !entry.summary.trim()) throw new Error('Invalid publication text');
    const key = `${entry.type}:${entry.id}`;
    if (keys.has(key)) throw new Error('Duplicate publication entry');
    keys.add(key);
  }
  return manifest;
}
export function createManifest({ challenges = [], notes = [], revisions = {}, production = false } = {}) {
  const entries = [['challenge', challenges], ['note', notes]].flatMap(([type, collection]) => collection.filter(entry => !entry.data.draft).map(entry => ({ type, id: entry.id, title: entry.data.title, summary: entry.data.summary, url: publicationUrl(type, entry.id) })));
  entries.sort((a, b) => `${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`, 'en'));
  return validateManifest({ version: 1, production, revisions, entries }, { requireProduction: false });
}
