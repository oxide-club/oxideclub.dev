import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const routes = [
  '/',
  '/desafios',
  '/notas',
  '/desafios/recriando-wc',
  '/codigo-de-conduta',
  '/404',
];
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
  await page.goto('/desafios/recriando-wc');
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
