import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
export default defineConfig({
  site: 'https://oxideclub.dev',
  output: 'static',
  integrations: [sitemap()],
  markdown: {
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
