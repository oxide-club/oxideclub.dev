import { test, expect } from '@playwright/test';

for (const width of [375, 1440]) {
  test(`writing paths and keyboard navigation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page
      .getByRole('link', { name: 'Como contribuir com um texto' })
      .click();
    await expect(page).toHaveURL(/\/notas\/#contribuir$/);
    await expect(page.locator('#contribuir')).toBeInViewport();
    const navigation = page.getByRole('navigation', {
      name: width === 375 ? 'Navegação móvel' : 'Navegação principal',
    });
    if (width === 375) {
      await page.locator('.mobile-nav summary').focus();
      await page.keyboard.press('Enter');
    }
    const notes = navigation.getByRole('link', { name: 'Notas', exact: true });
    await expect(notes).toHaveAttribute('aria-current', 'page');
    await notes.focus();
    expect(
      await notes.evaluate((el) => getComputedStyle(el).outlineStyle),
    ).toBe('solid');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/notas\/$/);
    if (width === 375)
      await expect(page.locator('.mobile-nav')).not.toHaveAttribute('open');
    await page.getByRole('link', { name: 'Como enviar seu texto' }).click();
    await expect(page.locator('#contribuir')).toBeInViewport();
    await expect(
      page
        .locator('#contribuir')
        .getByRole('link', { name: 'Ver como contribuir no GitHub' }),
    ).toHaveAttribute(
      'href',
      'https://github.com/oxide-club/notes/blob/main/CONTRIBUTING.md',
    );
    await page.goto('/desafios/001-wc/');
    await page.getByRole('link', { name: 'Como propor um texto' }).click();
    await expect(page.locator('#contribuir')).toBeInViewport();
  });
}

test('GitHub contribution and calendar subscription work without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto('/como-participar/');
    await expect(
      page.getByRole('link', {
        name: 'Ver o guia de contribuição',
        exact: true,
      }),
    ).toHaveAttribute(
      'href',
      'https://github.com/oxide-club/notes/blob/main/CONTRIBUTING.md',
    );
    await page
      .getByRole('link', { name: 'Conheça os encontros em preparação' })
      .click();
    const state = page.locator('.empty-meetings');
    const calendar = page.locator('.calendar-subscription');
    expect(
      await state.evaluate((el) =>
        Boolean(
          el.compareDocumentPosition(
            document.querySelector('.calendar-subscription')!,
          ) & Node.DOCUMENT_POSITION_FOLLOWING,
        ),
      ),
    ).toBe(true);
    await expect(state.getByRole('link')).toHaveAttribute(
      'href',
      'https://discord.gg/cgFWUkgRfX',
    );
    await calendar.locator('summary').click();
    await expect(calendar.getByRole('link')).toHaveAttribute(
      'href',
      '/encontros/calendario.ics',
    );
  } finally {
    await context.close();
  }
});
