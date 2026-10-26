import { test, expect } from '@playwright/test';

test('compact list combines filters, shares state and restores history', async ({
  page,
}) => {
  await page.goto('/desafios/lista');
  const rows = page.locator('tbody tr:visible');
  await page.getByLabel('Área', { exact: true }).selectOption('memory');
  await page
    .getByLabel('Dificuldade', { exact: true })
    .selectOption('intermediate');
  await expect(
    page.getByRole('link', { name: 'Arena de memória alinhada', exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/area=memory.*difficulty=intermediate/);
  await page.reload();
  await expect(page.getByLabel('Área', { exact: true })).toHaveValue('memory');
  await expect(page.getByLabel('Dificuldade', { exact: true })).toHaveValue(
    'intermediate',
  );
  await page.goBack();
  await expect(page.getByLabel('Dificuldade', { exact: true })).toHaveValue('');
  await page.goForward();
  await expect(page.getByLabel('Dificuldade', { exact: true })).toHaveValue(
    'intermediate',
  );
  await page.getByRole('searchbox').fill('impossivel');
  await expect(rows).toHaveCount(0);
  await expect(
    page.getByText('Nenhum desafio encontrado.', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Limpar filtros', exact: true })
    .first()
    .click();
  await page.getByRole('button', { name: 'Número', exact: true }).click();
  await expect(page.locator('[data-sort-heading=number]')).toHaveAttribute(
    'aria-sort',
    'descending',
  );
  await page.getByRole('searchbox').fill('ALOCACAO ARENA');
  await expect(
    rows.locator('a', { hasText: 'Arena de memória alinhada' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Limpar filtros', exact: true })
    .first()
    .click();
  await expect(page.locator('[data-sort-heading=number]')).toHaveAttribute(
    'aria-sort',
    'descending',
  );
});

test('invalid URL values fall back safely and mobile metadata fits', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto(
    '/desafios/lista?area=unknown&difficulty=bad&sort=bad&direction=bad',
  );
  await expect(page.getByLabel('Área', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Dificuldade', { exact: true })).toHaveValue('');
  await expect(page.locator('tbody tr').first()).toContainText(
    'Fundamentos de sistemas',
  );
  await expect(page.locator('tbody tr').first().getByRole('term')).toHaveText([
    'Área',
    'Dificuldade',
  ]);
  await expect(
    page.locator('tbody tr').first().getByRole('definition'),
  ).toHaveText(['Fundamentos de sistemas', 'Iniciante']);
  await expect(page.getByRole('searchbox')).toBeVisible();
  await page.getByRole('searchbox').fill('ALOCACAO ARENA');
  await expect(
    page.getByRole('link', { name: 'Arena de memória alinhada', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Limpar filtros', exact: true })
    .first()
    .click();
  await expect(page.getByRole('searchbox')).toHaveValue('');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('desktop exposes each area and difficulty once without mobile duplicate semantics', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/desafios/lista');
  const row = page.locator('tbody tr').first();
  await expect(row.getByRole('cell')).toHaveCount(4);
  await expect(row.getByRole('term')).toHaveCount(0);
  await expect(
    row.getByRole('cell', { name: 'Fundamentos de sistemas', exact: true }),
  ).toHaveCount(1);
  await expect(
    row.getByRole('cell', { name: 'Iniciante', exact: true }),
  ).toHaveCount(1);
});

test('compact list links remain available without JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  const page = await context.newPage();
  await page.goto('/desafios/lista');
  await expect(page.getByRole('search')).toBeHidden();
  await expect(page.locator('tbody a').first()).toBeVisible();
  await context.close();
});
