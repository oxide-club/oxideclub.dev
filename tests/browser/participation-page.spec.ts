import { test, expect } from '@playwright/test';

for (const width of [375, 1440]) {
  test(`participation navigation opens its own page and home link returns to root at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/desafios/');
    const navigation = page.getByRole('navigation', {
      name: width === 375 ? 'Navegação móvel' : 'Navegação principal',
    });
    if (width === 375) await page.locator('.mobile-nav summary').click();
    await navigation
      .getByRole('link', { name: 'Como participar', exact: true })
      .click();
    await expect(page).toHaveURL(/\/como-participar\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Como participar',
    );
    if (width === 375) {
      await expect(page.locator('.mobile-nav')).not.toHaveAttribute('open');
      await page.locator('.mobile-nav summary').click();
    }
    await expect(
      navigation.getByRole('link', { name: 'Como participar', exact: true }),
    ).toHaveAttribute('aria-current', 'page');
    await navigation.getByRole('link', { name: 'Início', exact: true }).click();
    await expect(page).toHaveURL(/:\d+\/$/);
    if (width === 375) await page.locator('.mobile-nav summary').click();
    await expect(
      navigation.getByRole('link', { name: 'Início', exact: true }),
    ).toHaveAttribute('aria-current', 'page');
  });
}
