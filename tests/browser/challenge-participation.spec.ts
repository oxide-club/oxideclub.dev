import { test, expect } from '@playwright/test';

const discordInvite = 'https://discord.gg/cgFWUkgRfX';
const contributionGuide =
  'https://github.com/oxide-club/solutions/blob/main/CONTRIBUTING.md#compartilhar-uma-implementação';

test('challenge offers a visible mobile discussion action and distinct catalogue contribution', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/desafios/001-wc/');
  const discussion = page.locator('.page-intro').getByRole('link', {
    name: 'Conversar sobre a solução no Discord',
  });
  await expect(discussion).toBeInViewport();
  await expect(discussion).toHaveAttribute('href', discordInvite);
  const community = page.getByRole('region', {
    name: 'Implementações da comunidade',
  });
  await expect(
    community.getByRole('link', {
      name: 'Conversar sobre a solução no Discord',
    }),
  ).toHaveAttribute('href', discordInvite);
  await expect(
    community.getByRole('link', {
      name: 'Compartilhe sua implementação',
    }),
  ).toHaveAttribute('href', contributionGuide);
});

test('on-page sharing guide provides Discord and GitHub paths without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto('/desafios/#como-compartilhar');
    const guide = page.getByRole('region', {
      name: 'Compartilhe sua tentativa ou descoberta',
    });
    await expect(guide).toBeInViewport();
    await expect(
      guide.getByRole('link', { name: 'Entrar no Discord' }),
    ).toHaveAttribute('href', discordInvite);
    await expect(
      guide.getByRole('link', { name: 'Ver o guia no GitHub' }),
    ).toHaveAttribute('href', contributionGuide);
  } finally {
    await context.close();
  }
});
