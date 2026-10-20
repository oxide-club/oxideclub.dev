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
