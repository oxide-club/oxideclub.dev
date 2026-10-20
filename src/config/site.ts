import rawLinks from './links.json';
import { validateLinks } from '../lib/content.mjs';
export const links = validateLinks(rawLinks);
export const site = {
  name: 'Oxide Club',
  url: 'https://oxideclub.dev',
  description:
    'Comunidade independente de programação de sistemas e fundamentos da computação. Estudos conjuntos, compartilhamento de projetos e desafios práticos.',
  production: import.meta.env.SITE_RELEASE === 'production',
};
