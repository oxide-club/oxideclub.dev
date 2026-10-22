import { test, expect } from '@playwright/test';

test('compact list combines filters, shares state and restores history', async ({
  page,
}) => {
  await page.goto('/desafios/lista');
  const rows = page.locator('tbody tr:visible');
  await expect(rows).toHaveCount(21);
  await page.getByLabel('Área', { exact: true }).selectOption('memory');
  await expect(rows).toHaveCount(3);
  await page
    .getByLabel('Dificuldade', { exact: true })
    .selectOption('intermediate');
  await expect(rows).toHaveCount(1);
  await expect(rows).toContainText('Arena de memória alinhada');
  await expect(page).toHaveURL(/area=memory.*difficulty=intermediate/);
  await page.reload();
  await expect(rows).toHaveCount(1);
  await page.goBack();
  await expect(rows).toHaveCount(3);
  await page.goForward();
  await expect(rows).toHaveCount(1);
  await page.getByRole('searchbox').fill('impossivel');
  await expect(rows).toHaveCount(0);
  await expect(
    page.getByText('Nenhum desafio encontrado.', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Limpar filtros', exact: true })
    .first()
    .click();
  await expect(rows).toHaveCount(21);
  await page.getByRole('button', { name: 'Número', exact: true }).click();
  await expect(rows.first()).toContainText('021');
  await page.getByRole('searchbox').fill('ALOCACAO ARENA');
  await expect(rows).toHaveCount(1);
  await expect(rows).toContainText('017');
  await page
    .getByRole('button', { name: 'Limpar filtros', exact: true })
    .first()
    .click();
  await expect(rows.first()).toContainText('021');
});

test('invalid URL values fall back safely and mobile metadata fits', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto(
    '/desafios/lista?area=unknown&difficulty=bad&sort=bad&direction=bad',
  );
  await expect(page.locator('tbody tr:visible')).toHaveCount(21);
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

test('compact list remains complete without JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  const page = await context.newPage();
  await page.goto('/desafios/lista');
  await expect(page.locator('tbody tr')).toHaveCount(21);
  await expect(page.getByRole('search')).toBeHidden();
  await expect(page.locator('tbody a')).toHaveCount(21);
  await context.close();
});
