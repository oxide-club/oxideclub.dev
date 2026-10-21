import { test, expect } from '@playwright/test';

for (const path of ['/desafios', '/desafios/lista']) {
  for (const width of [320, 1440]) {
    test(`back to top returns focus and preserves state on ${path} at ${width}px`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height: 640 });
      await page.goto(path);
      const button = page.getByRole('button', {
        name: 'Voltar ao topo do catálogo',
      });
      await expect(button).toBeHidden();
      if (path.endsWith('lista')) {
        await page.getByRole('searchbox').fill('a');
        await expect(page).toHaveURL(/\?q=a$/);
      }
      const url = page.url();
      await page.evaluate(() => scrollTo(0, 1000));
      await expect(button).toBeVisible();
      const bounds = await button.boundingBox();
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      await expect
        .poll(() =>
          button.evaluate((element) => {
            const box = element.getBoundingClientRect();
            return [
              ...document.querySelectorAll('a,button,input,select,summary'),
            ].filter((other) => {
              if (other === element || !other.checkVisibility()) return false;
              const r = other.getBoundingClientRect();
              return (
                r.left < box.right &&
                r.right > box.left &&
                r.top < box.bottom &&
                r.bottom > box.top
              );
            }).length;
          }),
        )
        .toBe(0);
      await button.focus();
      await page.keyboard.press('Enter');
      await expect(button).toBeHidden();
      await expect(
        page.locator('#catalogue-top a[aria-current="page"]'),
      ).toBeFocused();
      await expect(page.locator('#catalogue-top')).toBeInViewport();
      expect(page.url()).toBe(url);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.evaluate(() => scrollTo(0, 1000));
      await expect(button).toBeVisible();
      await button.click();
      await expect(button).toBeHidden();
      await expect(page.locator('#catalogue-top')).toBeInViewport();
    });
  }
}
