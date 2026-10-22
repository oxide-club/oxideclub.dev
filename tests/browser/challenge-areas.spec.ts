import { test, expect } from '@playwright/test';

test('areas show every published challenge exactly once and link to stable sections', async ({
  page,
}) => {
  await page.goto('/desafios');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'O que você quer explorar?',
  );
  const sections = page.locator('[data-area-section]');
  await expect(sections).toHaveCount(6);
  expect(
    await sections.evaluateAll((nodes) =>
      nodes.map((node) => node.querySelectorAll('[data-challenge]').length),
    ),
  ).toEqual([3, 5, 4, 3, 3, 3]);
  const destinations = await sections
    .locator('h3 a')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  expect(destinations).toHaveLength(21);
  expect(new Set(destinations).size).toBe(21);
  for (const title of await sections.locator('h3').allTextContents())
    expect(title.trim()).not.toMatch(/^#\d/);
  const index = page.getByRole('navigation', { name: 'Áreas de interesse' });
  await expect(index.getByRole('link')).toHaveCount(6);
  for (const link of await index.getByRole('link').all()) {
    const href = await link.getAttribute('href');
    await expect(page.locator(href!)).toHaveCount(1);
  }
  await page.goto('/desafios/017-arena');
  await expect(
    page.getByRole('link', { name: 'Memória e alocação', exact: true }),
  ).toHaveAttribute('href', '/desafios#memoria-e-alocacao');
});

test('areas and challenge links remain available without JavaScript at 320px', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
    viewport: { width: 320, height: 640 },
  });
  const page = await context.newPage();
  await page.goto('/desafios');
  await expect(page.locator('[data-area-section] h3 a')).toHaveCount(21);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole('navigation', { name: 'Áreas de interesse' })
    .getByRole('link', { name: /Memória e alocação/ })
    .click();
  await expect(page).toHaveURL(/#memoria-e-alocacao$/);
  await context.close();
});
