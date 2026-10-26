import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const route = '/roadmaps/concorrencia-sincronizacao-e-execucao-assincrona/';
test('catalogue and diagram lead to canonical materials and retain the alternate list', async ({
  page,
}) => {
  await page.goto('/roadmaps/');
  await expect(page.locator('[data-roadmap-card]')).toHaveCount(10);
  await page
    .locator('[data-roadmap-card] a')
    .filter({ hasText: 'Concorrência' })
    .click();
  await expect(page.locator('[data-roadmap-diagram]')).toHaveAttribute(
    'data-ready',
    'true',
  );
  await expect(page.locator('[data-roadmap-node]')).toHaveCount(5);
  await page.getByRole('button', { name: 'Lista', exact: true }).click();
  await expect(page.locator('[data-roadmap-list]')).toBeVisible();
  const link = page
    .locator('[data-roadmap-list] a[href="/labs/010-concurrency-lab/"]')
    .first();
  await link.click();
  await expect(page).toHaveURL(/\/labs\/010-concurrency-lab\/$/);
});
test('the whole material block supports native link activation', async ({
  page,
}) => {
  await page.goto(route);
  const graph = page.locator('[data-roadmap-diagram]');
  await expect(graph).toHaveAttribute('data-ready', 'true');
  const card = graph.locator('[data-ref="labs:010-concurrency-lab"]');
  await card.click({ position: { x: 12, y: 12 } });
  await expect(page).toHaveURL(/\/labs\/010-concurrency-lab\/$/);
});
test('finishing a delayed diagram does not hide the focused static list', async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/elk.bundled*.js', async (request) => {
    await gate;
    await request.continue();
  });
  await page.goto(route);
  const list = page.locator('[data-roadmap-list]');
  const link = list.locator('.material-link').first();
  await link.focus();
  release();
  await expect(page.locator('[data-roadmap-diagram]')).toHaveAttribute(
    'data-ready',
    'true',
  );
  await expect(list).toBeVisible();
  await expect(link).toBeFocused();
  await expect(
    page.getByRole('button', { name: 'Lista', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});
for (const width of [320, 390, 768, 1280])
  test(`roadmaps remain accessible at ${width}px and 200% text`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(route);
    await expect(page.locator('[data-roadmap-diagram]')).toHaveAttribute(
      'data-ready',
      'true',
    );
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.evaluate(() => {
      const items = [
        ...document.querySelectorAll<HTMLElement>(
          '[data-roadmap-node], [data-roadmap-node] *',
        ),
      ].map((el) => ({ el, size: parseFloat(getComputedStyle(el).fontSize) }));
      for (const { el, size } of items) el.style.fontSize = `${size * 2}px`;
    });
    await expect
      .poll(async () =>
        page
          .locator('[data-roadmap-node]')
          .evaluateAll((nodes) =>
            nodes.every((n) => n.scrollHeight <= n.clientHeight + 1),
          ),
      )
      .toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole('button', { name: 'Lista', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-roadmap-list]')).toBeVisible();
  });
test('without JavaScript the full curriculum and relations remain navigable', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  try {
    const page = await context.newPage();
    await page.goto(route);
    await expect(page.locator('[data-roadmap-list]')).toBeVisible();
    await expect(
      page.locator('[data-roadmap-list] [data-material]'),
    ).toHaveCount(5);
    await expect(
      page.getByRole('button', { name: 'Diagrama', exact: true }),
    ).toBeHidden();
    await expect(page.locator('[data-roadmap-list]')).toContainText(
      'Convergência',
    );
  } finally {
    await context.close();
  }
});
test('all ten diagrams avoid node overlaps and arrows through unrelated blocks', async ({
  page,
}) => {
  await page.goto('/roadmaps/');
  const routes = await page
    .locator('[data-roadmap-card] h2 a')
    .evaluateAll((links) => links.map((a) => a.getAttribute('href')!));
  for (const path of routes) {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(path);
    await expect(page.locator('[data-roadmap-diagram]')).toHaveAttribute(
      'data-ready',
      'true',
    );
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const graph = document.querySelector<HTMLElement>(
              '[data-roadmap-diagram]',
            )!;
            const cards = [
              ...graph.querySelectorAll<HTMLElement>('[data-roadmap-node]'),
            ];
            const boxes = cards.map((n) => ({
              ref: n.dataset.ref!,
              x: n.offsetLeft,
              y: n.offsetTop,
              w: n.offsetWidth,
              h: n.offsetHeight,
            }));
            for (const a of boxes)
              for (const b of boxes)
                if (
                  a.ref !== b.ref &&
                  a.x < b.x + b.w &&
                  a.x + a.w > b.x &&
                  a.y < b.y + b.h &&
                  a.y + a.h > b.y
                )
                  return false;
            const edges = JSON.parse(
              document.querySelector<HTMLElement>('[data-roadmap-viewer]')!
                .dataset.graph!,
            ).edges;
            const paths = [
              ...graph.querySelectorAll<SVGPathElement>('.roadmap-edge'),
            ];
            if (paths.length !== edges.length) return false;
            return paths.every((p, i) => {
              for (let s = 0; s < p.getTotalLength(); s += 8) {
                const pt = p.getPointAtLength(s);
                if (
                  boxes.some(
                    (n) =>
                      n.ref !== edges[i].from &&
                      n.ref !== edges[i].to &&
                      pt.x > n.x + 1 &&
                      pt.x < n.x + n.w - 1 &&
                      pt.y > n.y + 1 &&
                      pt.y < n.y + n.h - 1,
                  )
                )
                  return false;
              }
              return true;
            });
          }),
        { message: path },
      )
      .toBe(true);
  }
});
test('forced colors and rapid resizing retain readable diagrams and keyboard access', async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await page.goto(route);
  await expect(page.locator('[data-roadmap-diagram]')).toHaveAttribute(
    'data-ready',
    'true',
  );
  for (const width of [320, 1280, 390, 1000, 768, 1280])
    await page.setViewportSize({ width, height: 900 });
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await page.getByRole('button', { name: 'Lista', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('button', { name: 'Lista', exact: true }),
  ).toBeFocused();
  // Cores forçadas são aplicadas na pintura. O axe mistura cores autorais
  // de texto com o fundo imposto pelo navegador: https://github.com/dequelabs/axe-core/issues/3978
  // Os cenários acima continuam verificando o contraste com as cores normais.
  expect(
    (await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze())
      .violations,
  ).toEqual([]);
  await page.screenshot({
    path: 'test-results/roadmap-forced-colors.png',
    fullPage: true,
  });
});
