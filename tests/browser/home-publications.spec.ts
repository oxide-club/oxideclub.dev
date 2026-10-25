import { test, expect } from '@playwright/test';

test('home exposes editorial materials and recent publications without duplicates or JavaScript', async ({
  browser,
  request,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto('/');
    const featured = page.getByRole('region', {
      name: 'Em destaque',
      exact: true,
    });
    const recent = page.getByRole('region', {
      name: 'Publicações recentes',
      exact: true,
    });
    await expect(featured.getByRole('article')).toHaveCount(3);
    await expect(recent.locator('li')).toHaveCount(6);
    await expect(
      page.getByRole('link', { name: 'Explorar os materiais' }),
    ).toHaveAttribute('href', '#destaques');
    const featuredLinks = await featured
      .getByRole('link')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
    const recentLinks = await recent
      .locator('li a')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
    expect(recentLinks.some((href) => featuredLinks.includes(href))).toBe(
      false,
    );
    const dates = await recent
      .locator('time')
      .evaluateAll((times) =>
        times.map((time) => time.getAttribute('datetime')!),
      );
    expect(dates).toEqual([...dates].sort().reverse());
    for (const href of [...featuredLinks, ...recentLinks])
      expect((await request.get(href!)).ok(), href!).toBe(true);
    const club = page.getByRole('region', { name: 'O que acontece no clube' });
    await expect(
      club.getByRole('link', { name: 'Explorar os laboratórios' }),
    ).toHaveAttribute('href', '/labs/');
    for (const width of [320, 375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const nav = page.getByRole('navigation', {
        name: width <= 1050 ? 'Navegação móvel' : 'Navegação principal',
      });
      if (width <= 1050) await page.locator('.mobile-nav summary').click();
      for (const label of ['Laboratórios', 'Notas', 'Como participar'])
        await expect(
          nav.getByRole('link', { name: label, exact: true }),
        ).toBeVisible();
      if (width <= 1050) await page.locator('.mobile-nav summary').click();
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({
      path: 'test-results/home-publications-desktop.png',
      fullPage: true,
    });
    await page.setViewportSize({ width: 375, height: 900 });
    await page.screenshot({
      path: 'test-results/home-publications-mobile.png',
      fullPage: true,
    });
    await featured.getByRole('link').first().focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/labs\/003-memory-safety-lab\/?$/);
  } finally {
    await context.close();
  }
});
