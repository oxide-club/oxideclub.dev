import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtemp,
  cp,
  symlink,
  mkdir,
  writeFile,
  readFile,
  rm,
  access,
  readdir,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Fixtures live only in an isolated build, never in the publication directory.
test('notes: empty catalogue, published article, drafts and accessible reading', async () => {
  const root = await mkdtemp(join(tmpdir(), 'oxide-notes-'));
  let browser;
  try {
    for (const path of [
      'src',
      'public',
      'astro.config.mjs',
      'tsconfig.json',
      'package.json',
    ]) {
      await cp(path, join(root, path), { recursive: true });
    }
    await symlink(
      join(process.cwd(), 'node_modules'),
      join(root, 'node_modules'),
      'dir',
    );
    await rm(join(root, 'src/content/notes'), { recursive: true, force: true });
    await mkdir(join(root, 'src/content/notes'), { recursive: true });
    const build = () =>
      execFileSync(
        process.execPath,
        [join(root, 'node_modules/astro/bin/astro.mjs'), 'build'],
        {
          cwd: root,
          encoding: 'utf8',
          timeout: 60000,
          env: { ...process.env, SITE_RELEASE: 'production' },
        },
      );
    build();
    const empty = await readFile(join(root, 'dist/notas/index.html'), 'utf8');
    assert.match(empty, /Ainda não há notas publicadas/);
    assert.match(empty, /index, follow/);
    await assert.rejects(
      access(join(root, 'dist/notas/fixture-publica/index.html')),
    );
    await mkdir(join(root, 'src/content/notes'), { recursive: true });
    const fixture = (slug, draft, featured = false) =>
      `---\ntitle: 'Fixture de teste editorial'\nslug: '${slug}'\nsummary: 'Conteúdo sintético exclusivo da suíte de testes.'\npublishedAt: 2026-01-01\nupdatedAt: 2026-01-02\ndraft: ${draft}\nfeatured: ${featured}\n---\n\n## Observações\n\nTexto de teste com uma referência [1](#referências).\n\n\`\`\`c\nint main(void) { return 0; }\n\`\`\`\n\n> Uma citação de teste.\n\n<figure>\n<img src="/branding/oxide-core.svg" alt="Símbolo geométrico do Oxide Club" width="120" height="120" />\n<figcaption>Figura usada apenas na verificação.</figcaption>\n</figure>\n\n## Referências\n\n1. [Documentação do Astro](https://docs.astro.build/).\n`;
    await writeFile(
      join(root, 'src/content/notes/public.md'),
      fixture('fixture-publica', false, true),
    );
    await writeFile(
      join(root, 'src/content/notes/draft.md'),
      fixture('fixture-rascunho', true, true),
    );
    // Guarantee the real homepage exercises the notes adapter, independently of randomness.
    const challengeDirectory = join(root, 'src/content/challenges');
    for (const file of await readdir(challengeDirectory, { recursive: true })) {
      if (!file.endsWith('.md')) continue;
      const challengePath = join(challengeDirectory, file);
      await writeFile(
        challengePath,
        (await readFile(challengePath, 'utf8')).replace(
          /featured:\s*true/g,
          'featured: false',
        ),
      );
    }
    build();
    const listing = await readFile(join(root, 'dist/notas/index.html'), 'utf8');
    assert.match(listing, /href="\/notas\/fixture-publica"/);
    assert.doesNotMatch(
      listing,
      /fixture-rascunho|Ainda não há notas publicadas/,
    );
    await assert.rejects(
      access(join(root, 'dist/notas/fixture-rascunho/index.html')),
    );
    assert.match(
      await readFile(join(root, 'dist/index.html'), 'utf8'),
      /href="\/notas\/fixture-publica"/,
    );
    assert.doesNotMatch(
      await readFile(join(root, 'dist/sitemap-0.xml'), 'utf8'),
      /fixture-rascunho/,
    );
    const article = await readFile(
      join(root, 'dist/notas/fixture-publica/index.html'),
      'utf8',
    );
    assert.match(article, /<time datetime="2026-01-01T00:00:00.000Z"/);
    assert.match(article, /<blockquote>/);
    assert.match(article, /<figcaption>/);
    assert.match(article, /href="#observações"/);
    browser = await chromium.launch({
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    // Serve the isolated build through Playwright routing; no local server or live content writes.
    await page.route('http://notes.test/**', async (route) => {
      const pathname = new URL(route.request().url()).pathname;
      const file =
        pathname.endsWith('.css') ||
        pathname.includes('/branding/') ||
        pathname.includes('/_astro/')
          ? pathname.slice(1)
          : `${pathname.slice(1).replace(/\/$/, '')}/index.html`;
      try {
        await route.fulfill({ path: join(root, 'dist', file) });
      } catch {
        await route.fulfill({ status: 404, body: 'Not found' });
      }
    });
    let scenario = 0;
    for (const [path, html] of [
      ['/notas', empty],
      ['/notas', listing],
      ['/notas/fixture-publica', article],
    ]) {
      await page.route(`http://notes.test${path}`, (route) =>
        route.fulfill({ contentType: 'text/html', body: html }),
      );
      await page.goto(`http://notes.test${path}`);
      assert.deepEqual(
        (
          await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze()
        ).violations,
        [],
      );
      for (const width of [320, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        );
      }
      await page.setViewportSize({ width: 320, height: 900 });
      await page.addStyleTag({
        content:
          '* { line-height: 1.5!important; letter-spacing: .12em!important; word-spacing: .16em!important; }',
      });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      await mkdir('test-results', { recursive: true });
      await page.screenshot({
        path: `test-results/notes-${scenario++}-mobile.png`,
        fullPage: true,
      });
      if (path.includes('fixture-publica')) {
        await page.locator('.contents a').first().click();
        assert.equal(
          await page.locator('h2').first().getAttribute('id'),
          decodeURIComponent(new URL(page.url()).hash.slice(1)),
        );
        await page.locator('pre').focus();
        assert.equal(
          await page
            .locator('pre')
            .evaluate((el) => el === document.activeElement),
          true,
        );
      }
    }
  } finally {
    await browser?.close();
    await rm(root, { recursive: true, force: true });
  }
});
