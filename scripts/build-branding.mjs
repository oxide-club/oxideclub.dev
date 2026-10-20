// Requires rsvg-convert (librsvg) and ImageMagick on the development machine.
// The original artwork is never modified. Only its export viewport changes.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const original = readFileSync('oxide-club.svg', 'utf8');
const compact = original
  .replace('viewBox="0 0 877 877"', 'viewBox="116.5 110 642 642"')
  .replace('width="877" height="877"', 'width="642" height="642"');
writeFileSync('public/branding/oxide-core.svg', compact);
for (const size of [16, 32, 48, 180, 512]) {
  execFileSync('rsvg-convert', [
    '-w',
    String(size),
    '-h',
    String(size),
    'public/branding/oxide-core.svg',
    '-o',
    `public/branding/oxide-core-${size}.png`,
  ]);
}
execFileSync('magick', [
  'public/branding/oxide-core-16.png',
  'public/branding/oxide-core-32.png',
  'public/branding/oxide-core-48.png',
  'public/favicon.ico',
]);
const social = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#17191b"/>
<path d="M72 72H1128M72 558H1128" stroke="#3b3e40"/>
<svg x="72" y="157" width="280" height="280" viewBox="116.5 110 642 642">${original.match(/<g[\s\S]*<\/g>/)[0]}</svg>
<text x="400" y="270" font-family="sans-serif" font-size="72" font-weight="600" fill="#e8e2d8">Oxide Club</text>
<text x="404" y="336" font-family="sans-serif" font-size="30" fill="#d1875e">Computação com foco em sistemas.</text>
<text x="404" y="380" font-family="sans-serif" font-size="30" fill="#e8e2d8">Investigue. Experimente. Compartilhe.</text>
<text x="76" y="526" font-family="monospace" font-size="20" fill="#91989a">oxideclub.dev</text>
</svg>`;
writeFileSync('public/branding/social-card.svg', social);
execFileSync('rsvg-convert', [
  'public/branding/social-card.svg',
  '-o',
  'public/branding/social-card.png',
]);
