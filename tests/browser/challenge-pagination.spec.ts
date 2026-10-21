import { test, expect } from '@playwright/test';

test('pagination visits every challenge once and preserves the selected view', async ({
  page,
}) => {
  await page.goto('/desafios/');
  const cards = page.locator('[data-challenge]');
  const all = await cards
    .locator('h2 a')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  expect(all.length).toBeGreaterThan(12);
  const visible = page.locator('[data-challenge]:visible');
  await expect(visible).toHaveCount(12);
  const nav = page.getByRole('navigation', { name: 'Paginação dos desafios' });
  const previous = nav.getByRole('button', { name: 'Anterior' });
  const next = nav.getByRole('button', { name: 'Próxima' });
  await expect(previous).toBeDisabled();
  await page.getByRole('button', { name: 'Lista', exact: true }).click();
  const seen = [];
  for (let current = 1; current <= Math.ceil(all.length / 12); current++) {
    await expect(nav).toContainText(
      `Página ${current} de ${Math.ceil(all.length / 12)}`,
    );
    seen.push(
      ...(await visible
        .locator('h2 a')
        .evaluateAll((links) =>
          links.map((link) => link.getAttribute('href')),
        )),
    );
    if (current < Math.ceil(all.length / 12)) await next.click();
  }
  expect(seen).toEqual(all);
  await expect(next).toBeDisabled();
  await previous.click();
  await expect(page.locator('#challenge-catalogue')).toHaveAttribute(
    'data-view',
    'list',
  );
  await page.getByRole('searchbox').fill('001-wc');
  await expect(visible).toHaveCount(1);
  await expect(nav).toBeHidden();
  await page.getByRole('searchbox').fill('impossivel-nenhum-resultado');
  await expect(visible).toHaveCount(0);
  await expect(nav).toBeHidden();
  await page.getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(visible).toHaveCount(12);
  await expect(previous).toBeDisabled();
  await next.click();
  await page.getByLabel('Assunto', { exact: true }).selectOption('Streams');
  await expect(nav).toBeHidden();
  await expect(visible.first()).toContainText('wc');
});
