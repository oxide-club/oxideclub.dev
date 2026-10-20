import { test, expect, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const routes = [
  '/',
  '/desafios',
  '/notas',
  '/biblioteca',
  '/desafios/001-wc',
  '/desafios/002-ppm',
  '/codigo-de-conduta',
  '/404',
];
test('ppm resources use its own canonical directory and community section', async ({
  page,
}) => {
  const response = await page.goto('/desafios/002-ppm/');
  expect(response?.ok()).toBe(true);
  const resources = page.getByRole('region', {
    name: 'Recursos e implementações',
  });
  await expect(resources.getByRole('link')).toHaveCount(3);
  await expect(
    resources.getByRole('link', { name: 'Enunciado e testes' }),
  ).toHaveAttribute(
    'href',
    'https://github.com/oxide-club/challenges/tree/main/002-ppm',
  );
  await expect(
    resources.getByRole('link', { name: 'Implementação em C', exact: true }),
  ).toHaveAttribute(
    'href',
    'https://github.com/oxide-club/solutions/tree/main/002-ppm/c',
  );
  await expect(
    resources.getByRole('link', { name: 'Soluções da comunidade' }),
  ).toHaveAttribute(
    'href',
    'https://github.com/oxide-club/solutions/blob/main/COMMUNITY.md#002-ppm',
  );
});
test('wc resources expose only verified destinations and support keyboard focus', async ({
  page,
}) => {
  await page.goto('/desafios/001-wc/');
  const section = page.getByRole('region', {
    name: 'Recursos e implementações',
  });
  await expect(section.getByRole('link')).toHaveCount(3);
  await expect(
    section.getByRole('link', { name: 'Enunciado e testes' }),
  ).toHaveAttribute(
    'href',
    'https://github.com/oxide-club/challenges/tree/main/001-wc',
  );
  const implementation = section.getByRole('link', {
    name: 'Implementação em C',
    exact: true,
  });
  await expect(implementation).toHaveAttribute(
    'href',
    'https://github.com/oxide-club/solutions/tree/main/001-wc/c',
  );
  await expect(
    section.getByRole('link', { name: 'Soluções da comunidade' }),
  ).toHaveAttribute(
    'href',
    'https://github.com/oxide-club/solutions/blob/main/COMMUNITY.md#001-wc',
  );
  await section.getByRole('link').first().focus();
  await page.keyboard.press('Tab');
  await expect(implementation).toBeFocused();
  expect(
    await implementation.evaluate((el) => getComputedStyle(el).outlineStyle),
  ).toBe('solid');
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await section.screenshot({ path: `test-results/resources-${width}.png` });
  }
});
for (const route of routes) {
  test(`accessible static page: ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page.locator('h1')).toHaveCount(1);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(result.violations).toEqual([]);
    for (const width of [320, 375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page.setViewportSize({ width: 320, height: 900 });
    await page.addStyleTag({
      content:
        'html{font-size:200%} body{font-size:32px} p,a,li,code,small,span{font-size:inherit!important}',
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
test('keyboard navigation, disclosure, skip link and real destinations', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Pular para o conteúdo' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#conteudo')).toBeFocused();
  await page.getByText('Menu', { exact: false }).first().focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('navigation', { name: 'Navegação móvel' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('details')).not.toHaveAttribute('open');
  await expect(
    page.locator('a[href="https://discord.gg/cgFWUkgRfX"]').first(),
  ).toHaveAttribute('href', 'https://discord.gg/cgFWUkgRfX');
  await page.goto('/desafios/001-wc');
  await page.locator('summary').click();
  await page
    .getByRole('navigation', { name: 'Navegação móvel' })
    .getByRole('link', { name: 'O clube', exact: true })
    .click();
  await expect(page).toHaveURL(/\/#o-clube$/);
  await expect(page.locator('details')).not.toHaveAttribute('open');
});
test('forced colors and reduced motion preserve access', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe('auto');
  await page.screenshot({
    path: 'test-results/home-forced-colors.png',
    fullPage: true,
  });
});
test('internal links resolve and preview is non-indexable', async ({
  page,
  request,
}) => {
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    );
    const hrefs = await page
      .locator('a[href^="/"]')
      .evaluateAll((links) => links.map((a) => a.getAttribute('href')!));
    for (const href of new Set(hrefs)) {
      const response = await request.get(href.split('#')[0]);
      expect(response.ok(), href).toBe(true);
    }
  }
  await page.goto('/');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: 'test-results/home-desktop.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({
    path: 'test-results/home-mobile.png',
    fullPage: true,
  });
});

test('branding assets load and identify the home link without duplicate names', async ({
  page,
  request,
}) => {
  await page.goto('/');
  const home = page.getByRole('link', {
    name: 'Oxide Club — início',
    exact: true,
  });
  await expect(home).toBeVisible();
  await expect(home.locator('img')).toHaveAttribute('alt', '');
  expect(
    await home
      .locator('img')
      .evaluate(
        (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
      ),
  ).toBe(true);
  for (const path of [
    '/branding/oxide-core.svg',
    '/branding/oxide-core-16.png',
    '/branding/oxide-core-32.png',
    '/branding/oxide-core-48.png',
    '/branding/oxide-core-180.png',
    '/branding/oxide-core-512.png',
    '/branding/social-card.png',
    '/favicon.ico',
  ]) {
    expect((await request.get(path)).ok(), path).toBe(true);
  }
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://oxideclub.dev/branding/social-card.png',
  );
  await expect(
    page.locator('link[rel="icon"][type="image/svg+xml"]'),
  ).toHaveAttribute('href', '/branding/oxide-core.svg');
});

test('keyboard focus remains visible on every page', async ({ page }) => {
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route);
      const visited = new Set<string>();
      for (let step = 0; step < 60; step++) {
        await page.keyboard.press('Tab');
        const focus = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement;
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return {
            tag: el.tagName,
            key: el.outerHTML,
            outline: style.outlineStyle,
            width: parseFloat(style.outlineWidth),
            visible:
              rect.width > 0 &&
              rect.height > 0 &&
              rect.bottom > 0 &&
              rect.top < innerHeight,
          };
        });
        // Astro appends its development-only shadow-DOM toolbar after the site.
        // Its internal focus styling belongs to Astro, not the published page.
        if (focus.tag === 'ASTRO-DEV-TOOLBAR') break;
        if (focus.tag === 'BODY' || visited.has(focus.key)) break;
        visited.add(focus.key);
        // Focus can trigger smooth scrolling; verify the settled viewport.
        await expect
          .poll(
            () =>
              page.evaluate(() => {
                const rect = document.activeElement!.getBoundingClientRect();
                return (
                  rect.width > 0 &&
                  rect.height > 0 &&
                  rect.bottom > 0 &&
                  rect.top < innerHeight
                );
              }),
            { message: `${route}: ${focus.key}` },
          )
          .toBe(true);
        expect(focus.outline).not.toBe('none');
        expect(focus.width).toBeGreaterThanOrEqual(2);
      }
      expect(visited.size).toBeGreaterThan(4);
    }
  }
});

async function expectPublishedCatalogue(cards: Locator) {
  const links = cards.getByRole('heading').getByRole('link');
  const destinations = await links.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('href')!),
  );
  // Published content grows independently of the site. Keep known entries as
  // anchors, but verify the order of every entry instead of fixing the count.
  expect(destinations).toEqual(
    expect.arrayContaining(['/desafios/001-wc', '/desafios/002-ppm']),
  );
  expect(new Set(destinations).size).toBe(destinations.length);
  expect(destinations).toEqual([...destinations].sort().reverse());
  await expect(cards.filter({ visible: true })).toHaveCount(
    destinations.length,
  );
  return destinations;
}

test('challenge catalogue sorts descending and combines text and tags', async ({
  page,
}) => {
  await page.goto('/desafios');
  const destinations = await expectPublishedCatalogue(
    page.locator('[data-challenge]'),
  );
  const cards = page.locator('[data-challenge]:visible');
  const query = page.getByRole('searchbox', { name: 'Buscar desafios' });
  await expect(page.getByRole('search')).toBeVisible();
  await query.fill('001-WC SAIDA');
  await expect(cards).toHaveCount(1);
  await expect(cards.getByRole('heading').getByRole('link')).toHaveAttribute(
    'href',
    '/desafios/001-wc',
  );
  await page.getByLabel('Tag', { exact: true }).selectOption('Streams');
  await expect(cards).toHaveCount(1);
  await query.fill('002-ppm');
  await expect(cards).toHaveCount(0);
  await expect(
    page.getByText('Nenhum desafio encontrado.', { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('0 desafios encontrados');
  await page.getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(cards).toHaveCount(destinations.length);
  expect(await expectPublishedCatalogue(cards)).toEqual(destinations);
  await expect(query).toHaveValue('');
  await expect(page.getByLabel('Tag', { exact: true })).toHaveValue('');
  await query.focus();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Tag', { exact: true })).toBeFocused();
});

test('challenge catalogue remains available without JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  try {
    const page = await context.newPage();
    await page.goto('/desafios');
    await expectPublishedCatalogue(page.locator('[data-challenge]'));
    await expect(page.getByRole('search')).toBeHidden();
  } finally {
    await context.close();
  }
});
