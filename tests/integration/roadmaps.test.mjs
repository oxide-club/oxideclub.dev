import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtemp,
  cp,
  mkdir,
  writeFile,
  readFile,
  rm,
  symlink,
  access,
} from 'node:fs/promises';
import { join, resolve, extname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { stringify } from 'yaml';
import { emptyRoadmaps } from '../helpers/roadmaps.mjs';

test('roadmaps integrate notes in every curricular role and reject stale references across builds', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'oxide-roadmaps-build-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const roadmaps = await emptyRoadmaps(root);
  for (const path of [
    'src',
    'public',
    'astro.config.mjs',
    'tsconfig.json',
    'package.json',
    '.content/challenges',
    '.content/labs',
    '.content/solutions',
    '.content/meetings',
    '.content/notes',
  ])
    await cp(path, join(root, path), {
      recursive: true,
      filter: (p) => !p.split('/').includes('.git'),
    });
  await symlink(resolve('node_modules'), join(root, 'node_modules'), 'dir');
  await writeFile(
    join(root, 'src/config/home.json'),
    JSON.stringify({ featured: [] }),
  );
  const env = {
    ...process.env,
    CI: '',
    SITE_RELEASE: '',
    ROADMAPS_SOURCE: undefined,
    CHALLENGES_SOURCE: undefined,
    LABS_SOURCE: join(root, '.content/labs'),
    NOTES_SOURCE: undefined,
    MEETINGS_SOURCE: undefined,
    SOLUTIONS_SOURCE: undefined,
  };
  const build = () =>
    execFileSync(
      process.execPath,
      [resolve('node_modules/astro/bin/astro.mjs'), 'build'],
      { cwd: root, env, encoding: 'utf8', stdio: 'pipe', timeout: 60000 },
    );
  const html = (path) => readFile(join(root, 'dist', path), 'utf8');
  build();
  assert.match(
    await html('roadmaps/index.html'),
    /Ainda não há roadmaps publicados/,
  );
  const note = async (
    id,
    draft = false,
    title = 'Nota de teste curricular',
  ) => {
    await mkdir(join(root, '.content/notes', id), { recursive: true });
    await writeFile(
      join(root, '.content/notes', id, 'index.md'),
      `---\n${stringify({ title, summary: 'Investigue representações.', draft, publishedAt: '2026-10-25' })}---\n\n## Mecanismo\n\nTexto sintético de teste.\n`,
    );
  };
  await note('fundamentos');
  await note('contexto');
  await note('aprofundamento');
  await note('rascunho', true);
  const data = {
    version: 1,
    title: 'Trilha de teste com notas',
    summary: 'Materiais de três modalidades.',
    question: 'Como conectar materiais?',
    audience: 'Público de teste.',
    prerequisites: [],
    learningGoals: ['Explicar representações.'],
    draft: false,
    publishedAt: '2026-10-25',
    order: 1,
    nodes: [
      { ref: 'notes:fundamentos' },
      { ref: 'challenges:001-wc' },
      { ref: 'notes:contexto' },
      { ref: 'labs:001-binary-lab' },
      { ref: 'notes:aprofundamento' },
    ],
    edges: [
      {
        from: 'notes:fundamentos',
        to: 'challenges:001-wc',
        type: 'recommended_next',
      },
      {
        from: 'challenges:001-wc',
        to: 'labs:001-binary-lab',
        type: 'convergence',
      },
      {
        from: 'notes:contexto',
        to: 'labs:001-binary-lab',
        type: 'suggested_preparation',
      },
      {
        from: 'labs:001-binary-lab',
        to: 'notes:aprofundamento',
        type: 'branch',
      },
      {
        from: 'notes:contexto',
        to: 'notes:aprofundamento',
        type: 'convergence',
      },
    ],
    layout: {
      primaryPath: [
        'notes:fundamentos',
        'challenges:001-wc',
        'labs:001-binary-lab',
      ],
    },
  };
  const roadmap = async (id, value) => {
    await mkdir(join(roadmaps, id), { recursive: true });
    await writeFile(
      join(roadmaps, id, 'index.md'),
      `---\n${stringify(value)}---\n\n## Sentido pedagógico\n\nTextos sintéticos de teste.\n`,
    );
  };
  await roadmap('trilha-de-teste', data);
  await roadmap('rascunho', { ...data, draft: true });
  build();
  const rendered = await html('roadmaps/trilha-de-teste/index.html');
  for (const path of [
    '/notas/fundamentos/',
    '/notas/contexto/',
    '/notas/aprofundamento/',
    '/desafios/001-wc',
    '/labs/001-binary-lab/',
  ])
    assert.ok(rendered.includes(`href="${path}"`), path);
  assert.match(rendered, /Nota técnica/);
  await assert.rejects(access(join(root, 'dist/roadmaps/rascunho/index.html')));
  assert.doesNotMatch(await html('sitemap-0.xml'), /roadmaps\/rascunho/);
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await context.route('http://roadmaps.test/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      const file = join(
        root,
        'dist',
        path.endsWith('/') ? path + 'index.html' : path,
      );
      try {
        const body = await readFile(file);
        await route.fulfill({
          body,
          contentType:
            {
              '.html': 'text/html',
              '.js': 'text/javascript',
              '.css': 'text/css',
              '.woff2': 'font/woff2',
              '.svg': 'image/svg+xml',
              '.png': 'image/png',
            }[extname(file)] ?? 'application/octet-stream',
        });
      } catch {
        await route.fulfill({ status: 404, body: 'Not found' });
      }
    });
    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('http://roadmaps.test/roadmaps/trilha-de-teste/');
      await page.locator('[data-roadmap-diagram][data-ready=true]').waitFor();
      assert.equal(
        await page
          .locator('[data-roadmap-node] .material-kind')
          .filter({ hasText: 'Nota técnica' })
          .count(),
        3,
      );
      assert.equal(
        await page
          .locator(
            '[data-roadmap-node][data-ref="notes:fundamentos"] .difficulty',
          )
          .count(),
        0,
      );
      assert.deepEqual(
        (await new AxeBuilder({ page }).analyze()).violations,
        [],
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      await page.getByRole('button', { name: 'Lista', exact: true }).click();
      assert.equal(await page.locator('[data-roadmap-list]').isVisible(), true);
    }
  } finally {
    await browser.close();
  }
  await note('fundamentos', false, 'Título canônico atualizado');
  build();
  assert.match(
    await html('roadmaps/trilha-de-teste/index.html'),
    /Título canônico atualizado/,
  );
  await note('fundamentos', true);
  assert.throws(build, /notes:fundamentos/);
  await note('fundamentos');
  await rm(join(root, '.content/notes/contexto'), { recursive: true });
  assert.throws(build, /notes:contexto/);
});
