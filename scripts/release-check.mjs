import { readFileSync } from 'node:fs';
import { releaseBlockers } from '../src/lib/release.mjs';
const links = JSON.parse(
  readFileSync(new URL('../src/config/links.json', import.meta.url)),
);
const release = JSON.parse(
  readFileSync(new URL('../src/config/release.json', import.meta.url)),
);
const missing = releaseBlockers(links, release);
if (missing.length) {
  console.error(
    'Production release blocked:\n' +
      missing.map((item) => `- ${item}`).join('\n'),
  );
  process.exit(1);
}
