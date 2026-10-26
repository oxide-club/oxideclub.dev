import { emptyRoadmaps } from '../helpers/roadmaps.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtemp,
  cp,
  mkdir,
  symlink,
  writeFile,
  readFile,
  rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, extname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { stringify } from 'yaml';

test('community: empty/populated static builds, escaped notes, declared states, responsive accessible list and invalid-build failure', async () => {
  const root = await mkdtemp(join(tmpdir(), 'oxide-community-build-'));
  await emptyRoadmaps(root);
  let browser;
  try {
    for (const path of [
      'src',
      '.content/challenges',
      '.content/labs',
      '.content/notes',
      '.content/meetings',
      'public',
      'astro.config.mjs',
      'tsconfig.json',
      'package.json',
    ])
      await cp(path, join(root, path), { recursive: true });
    await cp(
      resolve(process.env.SOLUTIONS_SOURCE || '.content/solutions'),
      join(root, '.content/solutions'),
      { recursive: true, filter: (path) => !path.split('/').includes('.git') },
    );
    await symlink(
      join(process.cwd(), 'node_modules'),
      join(root, 'node_modules'),
      'dir',
    );
    const catalogue = join(root, '.content/solutions/001-wc/community.yaml');
    const challengePath = join(root, '.content/challenges/001-wc/index.md');
    const discordThreadUrl =
      'https://discord.com/channels/123456789012345678/234567890123456789';
    await writeFile(
      challengePath,
      (await readFile(challengePath, 'utf8')).replace(
        /^---\n/,
        `---\ndiscordThreadUrl: '${discordThreadUrl}'\n`,
      ),
    );
    const build = () =>
      execFileSync(
        process.execPath,
        [join(root, 'node_modules/astro/bin/astro.mjs'), 'build'],
        {
          cwd: root,
          encoding: 'utf8',
          timeout: 60000,
          env: {
            ...process.env,
            ROADMAPS_SOURCE: undefined,
            LABS_SOURCE: undefined,
            SOLUTIONS_SOURCE: undefined,
            SITE_RELEASE: 'production',
            CHALLENGES_COMMIT: process.env.CHALLENGES_COMMIT || 'a'.repeat(40),
            NOTES_COMMIT: process.env.NOTES_COMMIT || 'b'.repeat(40),
            NOTES_SOURCE: '',
            MEETINGS_SOURCE: '',
          },
          stdio: 'pipe',
        },
      );
    await writeFile(catalogue, 'implementations: []\n');
    build();
    const htmlPath = join(root, 'dist/desafios/001-wc/index.html');
    const empty = await readFile(htmlPath, 'utf8');
    assert.match(empty, /Compartilhe sua implementação/);
    assert.doesNotMatch(empty, /class="community-list"/);
    assert.match(empty, /solutions\/tree\/main\/001-wc\/c/);
    await writeFile(
      catalogue,
      stringify({
        implementations: [
          {
            author: 'Ana 🦀',
            authorUrl: 'https://example.org/ana',
            language: 'Rust',
            url: 'https://codeberg.org/example/wc',
            status: 'completed',
            notes: 'Leitura em fluxo. <script>alert(1)</script>',
          },
          {
            author: 'Bruno',
            language: 'Uma linguagem com nome longo',
            url: 'https://example.org/wc',
            status: 'partial',
          },
        ],
      }),
    );
    build();
    const populated = await readFile(htmlPath, 'utf8');
    assert.match(populated, /&lt;script&gt;/);
    assert.doesNotMatch(populated, /<script>alert\(1\)/);
    browser = await chromium.launch({
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    const serve = async (route) => {
      const pathname = new URL(route.request().url()).pathname;
      const path = join(
        root,
        'dist',
        pathname.endsWith('/') ? `${pathname}index.html` : pathname,
      );
      const types = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.woff2': 'font/woff2',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
      };
      try {
        await route.fulfill({
          body: await readFile(path),
          contentType: types[extname(path)] || 'application/octet-stream',
        });
      } catch {
        await route.fulfill({ status: 404, body: '' });
      }
    };
    await page.route('http://community.test/**', serve);
    const noJsContext = await browser.newContext({ javaScriptEnabled: false });
    const noJsPage = await noJsContext.newPage();
    await noJsPage.route('http://community.test/**', serve);
    await noJsPage.goto('http://community.test/desafios/001-wc/');
    assert.equal(await noJsPage.locator('.community-list li').count(), 2);
    await noJsContext.close();
    await mkdir('test-results', { recursive: true });
    for (const width of [360, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('http://community.test/desafios/001-wc/');
      const section = page.getByRole('region', {
        name: 'Implementações da comunidade',
        exact: true,
      });
      assert.equal(
        await page
          .locator('.page-intro')
          .getByRole('link', { name: 'Conversar sobre a solução no Discord' })
          .getAttribute('href'),
        discordThreadUrl,
      );
      assert.equal(
        await section
          .getByRole('link', { name: 'Conversar sobre a solução no Discord' })
          .getAttribute('href'),
        discordThreadUrl,
      );
      assert.equal(await section.getByRole('listitem').count(), 2);
      assert.equal(
        await section
          .getByRole('link', { name: 'Ana 🦀', exact: true })
          .getAttribute('href'),
        'https://example.org/ana',
      );
      assert.equal(
        await section.getByRole('link', { name: 'Bruno', exact: true }).count(),
        0,
      );
      assert.match(await section.innerText(), /Concluída/);
      assert.match(await section.innerText(), /Parcial/);
      assert.match(await section.innerText(), /declarados pelos participantes/);
      assert.equal(
        await section
          .getByRole('link', { name: 'Compartilhe sua implementação' })
          .getAttribute('href'),
        'https://github.com/oxide-club/solutions/blob/main/CONTRIBUTING.md#compartilhar-uma-implementação',
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        ),
        false,
      );
      const results = await new AxeBuilder({ page })
        .include('.community-implementations')
        .analyze();
      assert.deepEqual(results.violations, []);
      await section
        .getByRole('link', { name: /Código-fonte/ })
        .first()
        .focus();
      assert.equal(await page.locator(':focus').count(), 1);
      await page.locator('h1').click();
      await section.screenshot({ path: `test-results/community-${width}.png` });
    }
    await writeFile(catalogue, 'implementations:\n  - author: broken\n');
    assert.throws(build, /community.yaml|implementations/);
  } finally {
    await browser?.close();
    await rm(root, { recursive: true, force: true });
  }
});
