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
      '.content/challenges',
      '.content/meetings',
      'public',
      'astro.config.mjs',
      'tsconfig.json',
      'package.json',
    ]) {
      await cp(
        path === '.content/challenges' && process.env.CHALLENGES_TEST_SOURCE
          ? process.env.CHALLENGES_TEST_SOURCE
          : path,
        join(root, path),
        { recursive: true },
      );
    }
    await symlink(
      join(process.cwd(), 'node_modules'),
      join(root, 'node_modules'),
      'dir',
    );
    await rm(join(root, '.content/notes'), { recursive: true, force: true });
    await mkdir(join(root, '.content/notes'), { recursive: true });
    const build = (environment = {}) =>
      execFileSync(
        process.execPath,
        [join(root, 'node_modules/astro/bin/astro.mjs'), 'build'],
        {
          cwd: root,
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 60000,
          env: {
            ...process.env,
            SITE_RELEASE: 'production',
            NOTES_SOURCE: '',
            MEETINGS_SOURCE: '',
            ...environment,
          },
        },
      );
    build();
    const empty = await readFile(join(root, 'dist/notas/index.html'), 'utf8');
    assert.match(empty, /Ainda não há notas publicadas/);
    assert.match(empty, /index, follow/);
    await assert.rejects(
      access(join(root, 'dist/notas/fixture-publica/index.html')),
    );
    const initialChallenge = await readFile(
      join(root, 'dist/desafios/001-wc/index.html'),
      'utf8',
    );
    assert.match(initialChallenge, /id="challenge-resources-heading"/);
    assert.match(initialChallenge, /solutions\/tree\/main\/001-wc\/c"/);
    // Edit only frontmatter in the isolated fetched content, never live repositories.
    const setGithub = async (id, metadata) => {
      const path = join(root, `.content/challenges/${id}/index.md`);
      const content = (await readFile(path, 'utf8')).replace(
        /^github:.*\n(?:[ \t]+.*\n)*/m,
        '',
      );
      await writeFile(
        path,
        metadata === undefined
          ? content
          : content.replace(
              /^---\n/,
              `---\ngithub: ${JSON.stringify(metadata)}\n`,
            ),
      );
    };
    // Synthetic languages are confined to this isolated build, never published.
    await setGithub('001-wc', { solutions: ['rust', 'cpp'] });
    await setGithub('002-ppm', undefined);
    build();
    const resourcesHtml = await readFile(
      join(root, 'dist/desafios/001-wc/index.html'),
      'utf8',
    );
    assert.match(resourcesHtml, /solutions\/tree\/main\/001-wc\/rust/);
    assert.match(resourcesHtml, /solutions\/tree\/main\/001-wc\/cpp/);
    await mkdir(join(root, '.content/notes/fixture-publica/assets'), {
      recursive: true,
    });
    await mkdir(join(root, '.content/notes/fixture-rascunho/assets'), {
      recursive: true,
    });
    const fixture = (draft, featured = false) =>
      `---\ntitle: 'Fixture de teste editorial'\nsummary: 'Conteúdo sintético exclusivo da suíte de testes.'\npublishedAt: 2026-01-01\nupdatedAt: 2026-01-02\ndraft: ${draft}\nfeatured: ${featured}\n---\n\n## Observações\n\nTexto de teste com uma referência [1](#referências).\n\n\`\`\`c\nint main(void) { return 0; }\n\`\`\`\n\n> Uma citação de teste.\n\n![Diagrama usado na verificação](./assets/diagram.png)\n\n[Dados do experimento](./assets/data.csv)\n\n| Entrada | Saída |\n| --- | --- |\n| 1 | 2 |\n\n## Referências\n\n1. [Documentação do Astro](https://docs.astro.build/).\n`;
    await writeFile(
      join(root, '.content/notes/fixture-publica/index.md'),
      fixture(false, true),
    );
    await writeFile(
      join(root, '.content/notes/fixture-rascunho/index.md'),
      fixture(true, true),
    );
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1cAAAAASUVORK5CYII=',
      'base64',
    );
    for (const id of ['fixture-publica', 'fixture-rascunho']) {
      await writeFile(
        join(root, `.content/notes/${id}/assets/diagram.png`),
        png,
      );
      await writeFile(
        join(root, `.content/notes/${id}/assets/data.csv`),
        'input,output\n1,2\n',
      );
    }
    assert.doesNotMatch(
      resourcesHtml,
      /solutions\/tree\/main\/001-wc\/c"|COMMUNITY.md|Enunciado e testes/,
    );
    assert.doesNotMatch(
      await readFile(join(root, 'dist/desafios/002-ppm/index.html'), 'utf8'),
      /id="challenge-resources-heading"/,
    );
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
    // The homepage leads to the catalogue; published notes are linked there.
    assert.match(
      await readFile(join(root, 'dist/index.html'), 'utf8'),
      /href="\/notas"/,
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
    assert.match(article, /<table>/);
    assert.match(
      article,
      /github.com\/oxide-club\/notes\/blob\/main\/fixture-publica\/index.md/,
    );
    assert.match(article, /creativecommons.org\/licenses\/by\/4.0/);
    assert.match(
      article,
      /src="\/notas\/fixture-publica\/assets\/diagram.png"/,
    );
    await access(join(root, 'dist/notas/fixture-publica/assets/diagram.png'));
    await assert.rejects(
      access(join(root, 'dist/notas/fixture-rascunho/assets/diagram.png')),
    );
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
        pathname.includes('/_astro/') ||
        pathname.includes('/assets/')
          ? pathname.slice(1)
          : `${pathname.slice(1).replace(/\/$/, '')}/index.html`;
      try {
        await route.fulfill({ path: join(root, 'dist', file) });
      } catch {
        await route.fulfill({ status: 404, body: 'Not found' });
      }
    });
    await page.goto('http://notes.test/desafios/001-wc');
    const resourceLinks = page.locator('.languages a');
    assert.deepEqual(await resourceLinks.allTextContents(), [
      'Rust ↗',
      'C++ ↗',
    ]);
    await resourceLinks.first().focus();
    await page.keyboard.press('Tab');
    assert.equal(
      await resourceLinks
        .last()
        .evaluate((el) => el === document.activeElement),
      true,
    );
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
    }
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
        assert.equal(
          await page
            .getByAltText('Diagrama usado na verificação')
            .evaluate((image) => image.complete && image.naturalWidth > 0),
          true,
        );
        const source = page.getByRole('link', { name: 'Ver no GitHub' });
        await source.focus();
        assert.equal(
          await source.evaluate((el) => getComputedStyle(el).outlineStyle),
          'solid',
        );
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
    // A local checkout can preview uncommitted work without changing the production snapshot.
    const localNotes = join(root, 'local-notes');
    await cp(join(root, '.content/notes'), localNotes, { recursive: true });
    const localPath = join(localNotes, 'fixture-publica/index.md');
    await writeFile(
      localPath,
      (await readFile(localPath, 'utf8')).replace(
        'Fixture de teste editorial',
        'Prévia local não publicada',
      ),
    );
    build({ NOTES_SOURCE: localNotes, SITE_RELEASE: 'preview', CI: '' });
    assert.match(
      await readFile(
        join(root, 'dist/notas/fixture-publica/index.html'),
        'utf8',
      ),
      /Prévia local não publicada/,
    );
    assert.throws(
      () => build({ NOTES_SOURCE: localNotes }),
      /local previews only/,
    );
    // Exercise the actual Markdown pipeline, not just the plugin's visitor functions.
    const publishedPath = join(root, '.content/notes/fixture-publica/index.md');
    const original = await readFile(publishedPath, 'utf8');
    await writeFile(publishedPath, original + '\n<script>alert(1)</script>\n');
    assert.throws(() => build(), /raw HTML/);
    await writeFile(
      publishedPath,
      original.replace('publishedAt: 2026-01-01\n', ''),
    );
    assert.throws(() => build(), /Published notes require publishedAt/);
    await writeFile(publishedPath, original);
    await writeFile(
      join(root, '.content/notes/fixture-publica/assets/unsafe.js'),
      'alert(1)',
    );
    assert.throws(() => build(), /Unsupported note asset/);
    await rm(join(root, '.content/notes/fixture-publica/assets/unsafe.js'));
    // Empty and absent frontmatter metadata omit the whole resources section.
    await setGithub('001-wc', {});
    build();
    assert.doesNotMatch(
      await readFile(join(root, 'dist/desafios/001-wc/index.html'), 'utf8'),
      /id="challenge-resources-heading"/,
    );
    await setGithub('001-wc', undefined);
    build();
    assert.doesNotMatch(
      await readFile(join(root, 'dist/desafios/001-wc/index.html'), 'utf8'),
      /id="challenge-resources-heading"/,
    );
  } finally {
    await browser?.close();
    await rm(root, { recursive: true, force: true });
  }
});
