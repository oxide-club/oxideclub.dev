import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const preview = process.env.DESIGN_SYSTEM_PREVIEW === 'true';

test('component reference is excluded from the published site', async ({
  page,
}) => {
  test.skip(preview, 'Production build only');
  const response = await page.goto('/internal/design-system');
  expect(response?.status()).toBe(404);
});

test('reference demonstrates accessible actions and native reset behavior', async ({
  page,
}) => {
  test.skip(!preview, 'Development reference only');
  await page.goto('/internal/design-system');
  await expect(
    page.getByRole('heading', { name: 'Design system', exact: true }),
  ).toBeVisible();
  const form = page.getByRole('form', { name: 'Exemplo de filtros' });
  await form.getByLabel('Busca').fill('sistemas');
  await form.getByLabel('Nível', { exact: true }).selectOption('advanced');
  // A default action must not submit/reset its surrounding form.
  await form.getByRole('button', { name: 'Ação local' }).click();
  await expect(form.getByLabel('Busca')).toHaveValue('sistemas');
  await form.getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(form.getByLabel('Busca')).toHaveValue('');
  await expect(form.getByLabel('Nível', { exact: true })).toHaveValue('');
  await expect(
    page.getByRole('button', { name: 'Indisponível' }),
  ).toBeDisabled();
  await expect(
    page.getByRole('link', { name: 'Explorar desafios' }),
  ).toHaveAttribute('href', '/desafios');
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test('reference reflows with long labels and enlarged text', async ({
  page,
}) => {
  test.skip(!preview, 'Development reference only');
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/internal/design-system');
    await expect(
      page.getByRole('heading', { name: 'Design system', exact: true }),
    ).toBeVisible();
    await page.evaluate(() => {
      const sizes = [
        ...document.querySelectorAll<HTMLElement>('body, body *'),
      ].map((el) => ({ el, size: parseFloat(getComputedStyle(el).fontSize) }));
      for (const { el, size } of sizes) el.style.fontSize = `${size * 2}px`;
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
