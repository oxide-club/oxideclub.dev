import { test, expect } from '@playwright/test';

test('byte inspection connects repeated letters and handles LF with keyboard and pointer', async ({
  page,
}) => {
  await page.goto('/');
  const bytes = page.locator('.byte');
  await bytes.nth(3).focus();
  await expect(page.locator('.word [data-active]')).toHaveCount(1);
  await expect(page.locator('.word [data-active]')).toHaveAttribute(
    'data-letter',
    '3',
  );
  await expect(page.locator('.byte-readout')).toContainText('0x69');
  await bytes.nth(6).hover();
  await expect(page.locator('.word [data-active]')).toHaveAttribute(
    'data-letter',
    '6',
  );
  await page.locator('h1').hover();
  await expect(page.locator('.word [data-active]')).toHaveAttribute(
    'data-letter',
    '3',
  );
  await bytes.last().focus();
  await expect(page.locator('.word [data-active]')).toHaveCount(0);
  await expect(page.locator('.byte-readout')).toContainText('LF');
  await expect(page.locator('.byte-readout')).toContainText('00001010');
});

test('reduced motion preserves byte inspection without animated highlights', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const byte = page.locator('.byte').first();
  await byte.click();
  await expect(page.locator('.byte-readout')).toContainText('0x63');
  expect(await byte.evaluate((el) => getComputedStyle(el).animationName)).toBe(
    'none',
  );
});

test('each byte exposes its binary description without repeated live announcements', async ({
  page,
}) => {
  await page.goto('/');
  const bytes = page.locator('.byte');
  await expect(bytes.first()).toHaveAccessibleDescription('Binário: 01100011.');
  await expect(bytes.last()).toHaveAccessibleDescription('Binário: 00001010.');
  await expect(page.locator('.byte[data-active]')).toHaveCount(1);
  await expect(page.locator('.byte-readout')).toContainText('01100011');
  await bytes.first().hover();
  await bytes.nth(3).focus();
  await page.keyboard.press('Tab');
  await expect(bytes.nth(4)).toBeFocused();
  await expect(bytes.nth(4)).toHaveAccessibleDescription('Binário: 01101111.');
  await expect(page.locator('.byte-readout')).toContainText('01101111');
  expect(
    await bytes.nth(4).evaluate((el) => getComputedStyle(el).outlineStyle),
  ).toBe('solid');
  await expect(
    page.locator('.byte-study [aria-live], .byte-study [role="status"]'),
  ).toHaveCount(0);
});

test('byte information and the initial example remain available without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('.byte').first()).toHaveAccessibleDescription(
    'Binário: 01100011.',
  );
  await expect(page.locator('.byte').last()).toHaveAccessibleDescription(
    'Binário: 00001010.',
  );
  await expect(page.locator('.byte-readout')).toContainText('01100011');
  await expect(page.locator('.byte[data-active]')).toHaveCount(1);
  await expect(page.locator('.word [data-active]')).toHaveCount(1);
  await context.close();
});
