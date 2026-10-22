import markdownLabs from './src/lib/markdown-labs.mjs';
import { defineConfig } from 'astro/config';
import markdownNotes from './src/lib/markdown-notes.mjs';
import markdownMeetings from './src/lib/markdown-meetings.mjs';
import { satteri } from '@astrojs/markdown-satteri';
import sitemap from '@astrojs/sitemap';
export default defineConfig({
  site: 'https://oxideclub.dev',
  output: 'static',
  cacheDir: './.astro/cache',
  integrations: [sitemap()],
  markdown: {
    processor: satteri({
      mdastPlugins: [markdownNotes, markdownMeetings, markdownLabs],
    }),
    shikiConfig: {
      theme: 'github-dark',
      transformers: [
        {
          tokens(lines) {
            for (const line of lines)
              for (const token of line) {
                if (token.color?.toLowerCase() === '#6a737d')
                  token.color = '#91989a';
              }
          },
        },
      ],
    },
  },
});
