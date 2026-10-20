import { test, expect } from '@playwright/test';

test('library index follows scrolling without changing the URL and handles deep links', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/biblioteca#redes-de-computadores');
  const active = page.locator('.library-sidebar [aria-current="location"]');
  await expect(active).toHaveText('Redes de computadores');
  await page
    .locator('.library-category')
    .nth(1)
    .evaluate((section) => section.scrollIntoView());
  await expect(active).toHaveText('Programação em C');
  await expect(page).toHaveURL(/#redes-de-computadores$/);
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  await expect(active).toHaveText('Linguagens de programação e compiladores');
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(active).toHaveText('Fundamentos de computação');
  await expect(
    page.locator('.library-index [aria-current="location"]'),
  ).toHaveText('Fundamentos de computação');
});

test('library exposes all 40 resources in their eight approved categories', async ({
  page,
}) => {
  const response = await page.goto('/biblioteca');
  expect(response?.ok()).toBe(true);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Biblioteca _',
  );
  const categories = [
    ['Fundamentos de computação', 3],
    ['Programação em C', 6],
    ['Ferramentas de desenvolvimento e Unix', 6],
    ['Arquitetura de computadores', 6],
    ['Sistemas operacionais e programação de sistemas', 5],
    ['Estruturas de dados e algoritmos', 4],
    ['Redes de computadores', 4],
    ['Linguagens de programação e compiladores', 6],
  ] as const;
  for (const [name, count] of categories) {
    const category = page.getByRole('region', { name, exact: true });
    await expect(category.getByRole('link')).toHaveCount(count);
  }
  const resources = page.locator('main section a');
  await expect(resources).toHaveCount(40);
  const titles = await resources.allTextContents();
  expect(new Set(titles.map((title) => title.trim())).size).toBe(40);
  const urls = await resources.evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')!),
  );
  expect(new Set(urls).size).toBe(40);
  for (const url of urls) expect(new URL(url).protocol).toBe('https:');
  await expect(
    page
      .getByRole('link', {
        name: 'A Linguagem de Programação Rust',
        exact: true,
      })
      .locator('..'),
  ).toContainText('tradução histórica');
});

test('library is reachable from both menus and its mobile index works by keyboard', async ({
  page,
}) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const mobile = width === 390;
    if (mobile) await page.locator('.mobile-nav summary').press('Enter');
    const menu = page.getByRole('navigation', {
      name: mobile ? 'Navegação móvel' : 'Navegação principal',
      exact: true,
    });
    await menu.getByRole('link', { name: 'Biblioteca' }).click();
    await expect(page).toHaveURL(/\/biblioteca\/?$/);
    if (mobile) await page.locator('.mobile-nav summary').press('Enter');
    await expect(
      menu.getByRole('link', { name: 'Biblioteca' }),
    ).toHaveAttribute('aria-current', 'page');
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/biblioteca');
  const index = page.locator('.library-index');
  await expect(index).not.toHaveAttribute('open');
  await index.locator('summary').press('Enter');
  const destination = index.getByRole('link', {
    name: 'Redes de computadores',
    exact: true,
  });
  await destination.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#redes-de-computadores$/);
  await expect(
    page.getByRole('heading', {
      name: 'Redes de computadores',
      exact: true,
    }),
  ).toBeInViewport();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', {
      name: "Beej's Guide to Networking Concepts",
      exact: true,
    }),
  ).toBeFocused();
});

test('all library resources and category anchors work without JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
    viewport: { width: 390, height: 900 },
  });
  try {
    const page = await context.newPage();
    await page.goto('/biblioteca');
    await expect(page.locator('main section a')).toHaveCount(40);
    await page.locator('.library-index summary').click();
    await page
      .locator('.library-index')
      .getByRole('link', {
        name: 'Programação em C',
        exact: true,
      })
      .click();
    await expect(
      page.getByRole('heading', {
        name: 'Programação em C',
        exact: true,
      }),
    ).toBeInViewport();
  } finally {
    await context.close();
  }
});
