import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const catalogue = '/labs/';
const lab = catalogue + '005-cache-lab/';
test('laboratories are discoverable and downloads match the investigation', async ({
  page,
  request,
}) => {
  await page.goto(catalogue);
  await page
    .locator('article')
    .filter({
      has: page.getByRole('heading', {
        name: 'Cache e Localidade',
        exact: true,
      }),
    })
    .getByRole('link', { name: 'Explorar laboratório' })
    .click();
  await expect(page.locator('h1')).toContainText(
    'Laboratório de Cache e Localidade',
  );
  await expect(page.locator('article h2')).toHaveCount(8);
  await expect(page.locator('.desktop-nav a[aria-current]')).toHaveText(
    'Laboratórios',
  );
  await page.goto(encodeURI(lab));
  await expect(page.locator('h1')).toContainText('Cache e Localidade');
  const file = await request.get(
    encodeURI(lab + 'assets/materials/inputs/trace-a.txt'),
  );
  expect(file.status()).toBe(200);
  expect(await file.text()).toContain('L 0x00');
  const zip = await request.get(encodeURI(lab + 'materiais.zip'));
  expect(zip.status()).toBe(200);
  expect((await zip.body()).subarray(0, 2).toString()).toBe('PK');
  const summary = page.getByText('Conferir resultados dos traces', {
    exact: true,
  });
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(summary.locator('..')).toHaveAttribute('open', '');
});
for (const width of [320, 390, 1280])
  test(`labs remain accessible at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [catalogue, lab]) {
      await page.goto(path);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    if (width < 800) {
      const summary = page.locator('.mobile-contents>summary');
      await summary.focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('.mobile-contents')).toHaveAttribute(
        'open',
        '',
      );
      await page
        .locator('.mobile-contents')
        .getByRole('link', { name: 'Materiais', exact: true })
        .click();
      await expect(page).toHaveURL(/#materiais$/);
      await page.locator('.mobile-nav>summary').click();
      await page.keyboard.press('Escape');
      await expect(page.locator('.mobile-nav')).not.toHaveAttribute('open', '');
    }
    await page
      .locator('.prose details')
      .evaluateAll((elements) =>
        elements.forEach((el) => el.setAttribute('open', '')),
      );
    const targets = 'body, .mobile-nav summary, .desktop-nav a, .prose td';
    const beforeSizes = await page
      .locator(targets)
      .evaluateAll((elements) =>
        elements.map((el) => parseFloat(getComputedStyle(el).fontSize)),
      );
    await page.evaluate(() => {
      const values = [
        ...document.querySelectorAll<HTMLElement>('body, body *'),
      ].map((el) => ({ el, size: parseFloat(getComputedStyle(el).fontSize) }));
      for (const { el, size } of values)
        el.style.setProperty('font-size', `${size * 2}px`, 'important');
    });
    const afterSizes = await page
      .locator(targets)
      .evaluateAll((elements) =>
        elements.map((el) => parseFloat(getComputedStyle(el).fontSize)),
      );
    expect(afterSizes).toEqual(beforeSizes.map((size) => size * 2));
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

test('lab area index links to open sections with compact cards', async ({
  page,
}) => {
  await page.goto(catalogue);
  const sections = page.locator('[data-lab-area]');
  await expect(sections).toHaveCount(6);
  await expect(page.locator('[data-lab]')).toHaveCount(18);
  const links = page
    .getByRole('navigation', { name: 'Áreas dos laboratórios' })
    .getByRole('link');
  await expect(links).toHaveCount(6);
  for (const link of await links.all()) {
    const href = await link.getAttribute('href');
    await link.click();
    await expect(page.locator(href!)).toBeVisible();
    expect(new URL(page.url()).hash).toBe(href);
  }
  await expect(page.locator('[data-lab] h3').first()).toHaveText(
    'Representação Binária',
  );
  await expect(page.locator('[data-lab] dl')).toHaveCount(0);
});
