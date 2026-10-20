import { test, expect } from '@playwright/test';

test('mobile readers can jump directly to challenge tests without JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
    viewport: { width: 390, height: 900 },
  });
  try {
    const page = await context.newPage();
    await page.goto('/desafios/001-wc');
    await page.locator('.mobile-contents summary').click();
    await page
      .getByRole('navigation', { name: 'Índice do desafio' })
      .getByRole('link', { name: 'Teste sua implementação' })
      .click();
    await expect(page.locator('#challenge-testing-heading')).toBeInViewport();
  } finally {
    await context.close();
  }
});

test('library combines language and availability filters and restores the catalogue', async ({
  page,
}) => {
  await page.goto('/biblioteca');
  await page.getByLabel('Idioma', { exact: true }).selectOption('PT-BR');
  await page
    .getByLabel('Disponibilidade', { exact: true })
    .selectOption('gratuito');
  await expect(
    page.getByRole('link', { name: 'Pro Git', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Modern C', exact: true }),
  ).toBeHidden();
  await expect(
    page.getByRole('link', { name: 'Programação em Baixo Nível', exact: true }),
  ).toBeHidden();
  await expect(page.locator('#redes-de-computadores')).toBeHidden();
  await page
    .getByRole('button', { name: 'Limpar filtros', exact: true })
    .click();
  await expect(page.locator('.library-category li:visible')).toHaveCount(40);
  await expect(page.locator('#redes-de-computadores')).toBeVisible();
});
