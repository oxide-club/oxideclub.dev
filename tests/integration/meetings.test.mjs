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
import { join, extname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('meetings: static agenda, permanent articles, safe assets, calendar and responsive access', async () => {
  const root = await mkdtemp(join(tmpdir(), 'oxide-meetings-build-'));
  let browser;
  try {
    for (const path of [
      'src',
      '.content/challenges',
      '.content/labs',
      '.content/solutions',
      '.content/notes',
      'public',
      'astro.config.mjs',
      'tsconfig.json',
      'package.json',
    ])
      await cp(
        path === '.content/solutions'
          ? resolve(process.env.SOLUTIONS_SOURCE || path)
          : path,
        join(root, path),
        { recursive: true },
      );
    await symlink(
      join(process.cwd(), 'node_modules'),
      join(root, 'node_modules'),
      'dir',
    );
    const source = join(root, '.content/meetings');
    for (const name of ['meetings', 'assets', 'templates'])
      await mkdir(join(source, name), { recursive: true });
    for (const file of [
      'README.md',
      'CONTRIBUTING.md',
      'LICENSE',
      'templates/meeting.md',
    ])
      await writeFile(join(source, file), 'Fixture\n');
    const build = (env = {}) =>
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
            LABS_SOURCE: undefined,
            SITE_RELEASE: 'production',
            CHALLENGES_COMMIT: process.env.CHALLENGES_COMMIT || 'a'.repeat(40),
            NOTES_COMMIT: process.env.NOTES_COMMIT || 'b'.repeat(40),
            SOLUTIONS_SOURCE: undefined,
            MEETINGS_SOURCE: '',
            NOTES_SOURCE: '',
            ...env,
          },
        },
      );
    build();
    const read = (path) => readFile(join(root, 'dist', path), 'utf8');
    const empty = await read('encontros/index.html');
    assert.ok(
      empty.indexOf('class="empty-meetings"') <
        empty.indexOf('class="calendar-subscription"'),
    );
    assert.ok(
      !(await read('encontros/calendario.ics')).includes('BEGIN:VEVENT'),
    );
    const definition = (
      title,
      start,
      { draft = false, full = false, cancelled = false } = {},
    ) => {
      const date = start.slice(0, 10);
      const data = {
        title,
        summary: 'Uma investigação de sistemas.',
        startsAt: start,
        endsAt: `${date}T20:30:00-03:00`,
        timeZone: 'America/Fortaleza',
        format: 'online',
        createdAt: '2026-01-01T12:00:00-03:00',
        draft,
        ...(full
          ? {
              platform: 'Discord',
              participationUrl: 'https://example.org/room',
              materials: [
                {
                  title: 'Dados da sessão',
                  type: 'document',
                  url: '../assets/002-completo/data.csv',
                },
                {
                  title: 'Código de exemplo',
                  type: 'code',
                  url: 'https://github.com/oxide-club/meetings',
                },
                {
                  title: 'Gravação',
                  type: 'recording',
                  url: 'https://example.org/video',
                },
                {
                  title: 'Transcrição',
                  type: 'transcript',
                  url: 'https://example.org/text',
                },
              ],
            }
          : {}),
        ...(cancelled
          ? {
              cancelled: true,
              sequence: 1,
              updatedAt: '2026-02-01T12:00:00-03:00',
              changeNotice: 'Cancelado por indisponibilidade.',
            }
          : {}),
      };
      return `---\n${Object.entries(data)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(
          '\n',
        )}\n---\n\n## Pauta\n\n- Investigar execução.\n\n${full ? '## Registro técnico\n\nConclusões e perguntas abertas.\n\n[Dados](../assets/002-completo/data.csv)\n\n```c\nint main(void) { return 0; }\n```\n' : ''}`;
    };
    await mkdir(join(source, 'assets/002-completo'));
    await mkdir(join(source, 'assets/004-rascunho'));
    await writeFile(
      join(source, 'assets/002-completo/data.csv'),
      'input,output\n1,2\n',
    );
    await writeFile(
      join(source, 'assets/004-rascunho/private.txt'),
      'Draft only',
    );
    for (const [id, title, start, options] of [
      ['001-minimo', 'Encontro passado', '2020-01-01T19:00:00-03:00', {}],
      [
        '002-completo',
        'Encontro com acervo',
        '2026-10-28T19:00:00-03:00',
        { full: true },
      ],
      ['003-futuro', 'Encontro futuro', '2030-01-01T19:00:00-03:00', {}],
      [
        '004-rascunho',
        'Rascunho invisível',
        '2040-01-01T19:00:00-03:00',
        { draft: true },
      ],
      [
        '005-cancelado',
        'Encontro cancelado',
        '2026-11-01T19:00:00-03:00',
        { cancelled: true },
      ],
    ])
      await writeFile(
        join(source, `meetings/${id}.md`),
        definition(title, start, options),
      );
    build();
    const listing = await read('encontros/index.html');
    assert.ok(
      listing.indexOf('Encontro futuro') <
        listing.indexOf('Encontro com acervo'),
    );
    assert.ok(
      listing.indexOf('Encontro com acervo') <
        listing.indexOf('Encontro passado'),
    );
    assert.doesNotMatch(listing, /Rascunho invisível/);
    const full = await read('encontros/002-completo/index.html');
    assert.match(full, /id="materials-heading"/);
    assert.match(full, /href="\/encontros\/002-completo\/assets\/data.csv"/);
    assert.match(
      full,
      /github.com\/oxide-club\/meetings\/blob\/main\/meetings\/002-completo.md/,
    );
    const minimal = await read('encontros/001-minimo/index.html');
    assert.doesNotMatch(minimal, /id="materials-heading"|Acessar encontro/);
    const cancelled = await read('encontros/005-cancelado/index.html');
    assert.match(cancelled, /Cancelado por indisponibilidade/);
    const feed = await read('encontros/calendario.ics');
    assert.equal((feed.match(/BEGIN:VEVENT/g) || []).length, 4);
    assert.ok(feed.includes('STATUS:CANCELLED'));
    assert.ok(
      (await read('encontros/002-completo/calendario.ics')).includes(
        'UID:002-completo@meetings.oxideclub.dev',
      ),
    );
    for (const path of [
      'encontros/004-rascunho/index.html',
      'encontros/004-rascunho/calendario.ics',
      'encontros/004-rascunho/assets/private.txt',
    ])
      await assert.rejects(access(join(root, 'dist', path)));
    await access(join(root, 'dist/encontros/002-completo/assets/data.csv'));
    browser = await chromium.launch({
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    const serve = async (route) => {
      let pathname = decodeURIComponent(
        new URL(route.request().url()).pathname,
      ).slice(1);
      if (!extname(pathname))
        pathname = `${pathname.replace(/\/$/, '')}/index.html`;
      const types = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.csv': 'text/csv',
        '.woff2': 'font/woff2',
        '.svg': 'image/svg+xml',
      };
      try {
        await route.fulfill({
          path: join(root, 'dist', pathname),
          contentType: types[extname(pathname)],
        });
      } catch {
        await route.fulfill({ status: 404, body: 'Not found' });
      }
    };
    await page.route('http://meetings.test/**', serve);
    const noJsContext = await browser.newContext({ javaScriptEnabled: false });
    const noJsPage = await noJsContext.newPage();
    await noJsPage.route('http://meetings.test/**', serve);
    await noJsPage.goto('http://meetings.test/encontros/002-completo/');
    assert.equal(
      await noJsPage
        .getByRole('heading', { name: 'Encontro com acervo', exact: true })
        .count(),
      1,
    );
    assert.equal(
      await noJsPage.getByRole('link', { name: 'Acessar encontro' }).count(),
      1,
    );
    await noJsContext.close();
    await mkdir('test-results', { recursive: true });
    for (const route of [
      '/encontros/',
      '/encontros/002-completo/',
      '/encontros/001-minimo/',
      '/encontros/005-cancelado/',
    ]) {
      await page.goto(`http://meetings.test${route}`);
      assert.deepEqual(
        (
          await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze()
        ).violations,
        [],
      );
      for (const width of [320, 375, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
          `${route} at ${width}`,
        );
        if (width === 375 || width === 1440)
          await page.screenshot({
            path: `test-results/meetings-${route.replaceAll('/', '-')}-${width}.png`,
            fullPage: true,
          });
      }
      await page.setViewportSize({ width: 320, height: 900 });
      await page.addStyleTag({
        content:
          '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}',
      });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      await page.goto(`http://meetings.test${route}`);
      await page.evaluate(() => {
        const sizes = [...document.querySelectorAll('body,body *')].map(
          (el) => [el, parseFloat(getComputedStyle(el).fontSize)],
        );
        for (const [el, size] of sizes)
          el.style.setProperty('font-size', `${size * 2}px`, 'important');
      });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
    }
    await page.goto('http://meetings.test/encontros/002-completo/');
    const sourceLink = page.getByRole('link', { name: 'Ver fonte no GitHub' });
    await sourceLink.focus();
    assert.equal(
      await sourceLink.evaluate((el) => getComputedStyle(el).outlineStyle),
      'solid',
    );
    await page.locator('.contents a').first().click();
    assert.ok(page.url().endsWith('#pauta'));
    const file = join(source, 'meetings/002-completo.md'),
      original = await readFile(file, 'utf8');
    await writeFile(file, original + '\n<script>alert(1)</script>');
    assert.throws(() => build(), /raw HTML/);
    await writeFile(
      file,
      original.replace(
        '"2026-10-28T20:30:00-03:00"',
        '"2026-10-28T18:30:00-03:00"',
      ),
    );
    assert.throws(() => build(), /endsAt must be after/);
    await writeFile(file, original);
    assert.throws(
      () => build({ MEETINGS_SOURCE: source }),
      /local previews only/,
    );
  } finally {
    await browser?.close();
    await rm(root, { recursive: true, force: true });
  }
});
