import rawLinks from './links.json';
import { validateLinks } from '../lib/content.mjs';
export const links = validateLinks(rawLinks);
export const site = {
  name: 'Oxide Club',
  url: 'https://oxideclub.dev',
  description:
    'Clube independente de computação com foco em sistemas. Estudamos C, Rust, arquitetura de computadores e sistemas operacionais em comunidade.',
  production: import.meta.env.SITE_RELEASE === 'production',
};
