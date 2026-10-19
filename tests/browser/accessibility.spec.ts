import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = [
  '/',
  '/desafios',
  '/desafios/recriando-wc',
  '/codigo-de-conduta',
  '/404',
];
const noOverflow = () => document.documentElement.scrollWidth <= innerWidth;

for (const route of routes) {
  test(`text spacing and 200% text size: ${route}`, async ({ page }) => {
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      await page.addStyleTag({
        content:
          '* { line-height:1.5!important; letter-spacing:.12em!important; word-spacing:.16em!important; } p { margin-bottom:2em!important; }',
      });
      expect(await page.evaluate(noOverflow), `text spacing at ${width}`).toBe(
        true,
      );
      // Double each element's computed size, preserving the existing hierarchy.
      await page.goto(route);
      await page.evaluate(() => {
        const values = [
          ...document.querySelectorAll<HTMLElement>('body, body *'),
        ].map((el) => ({
          el,
          size: parseFloat(getComputedStyle(el).fontSize),
        }));
        for (const { el, size } of values)
          el.style.setProperty('font-size', `${size * 2}px`, 'important');
      });
      expect(await page.evaluate(noOverflow), `200% text at ${width}`).toBe(
        true,
      );
      if (width === 320)
        await page.screenshot({
          path: `test-results/text-200-${route.replaceAll('/', '-') || 'home'}.png`,
          fullPage: true,
        });
    }
  });

  test(`structure, accessibility tree and target sizes: ${route}`, async ({
    page,
  }) => {
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      const findings = await page.evaluate(() => {
        const headingLevels = [
          ...document.querySelectorAll(
            'main h1, main h2, main h3, main h4, main h5, main h6',
          ),
        ].map((e) => Number(e.tagName[1]));
        const jumps = headingLevels.filter(
          (level, i) => i > 0 && level > headingLevels[i - 1] + 1,
        );
        const targets = [
          ...document.querySelectorAll<HTMLElement>('a,button,summary'),
        ].filter((e) => {
          const r = e.getBoundingClientRect();
          return (
            e.checkVisibility() &&
            r.width > 0 &&
            r.height > 0 &&
            !e.classList.contains('skip')
          );
        });
        // Text links within prose qualify for the inline exception; all standalone controls must be 24×24.
        const undersized = targets
          .filter((e) => !e.closest('.prose p, .prose li'))
          .filter((e) => {
            const r = e.getBoundingClientRect();
            return r.width < 24 || r.height < 24;
          })
          .map((e) => e.outerHTML);
        return {
          jumps,
          undersized,
          mains: document.querySelectorAll('main').length,
        };
      });
      expect(findings).toEqual({ jumps: [], undersized: [], mains: 1 });
      const snapshot = await page.locator('body').ariaSnapshot();
      expect(snapshot).toContain('main:');
      expect(snapshot).toContain('Oxide Club — início');
      if (width === 320) {
        await page.locator('summary').press('Enter');
        await expect(page.locator('details')).toHaveAttribute('open', '');
        const client = await page.context().newCDPSession(page);
        const { nodes } = await client.send('Accessibility.getFullAXTree');
        const menu = nodes.find(
          (n) =>
            n.role?.value === 'DisclosureTriangle' &&
            n.name?.value.includes('Menu'),
        );
        expect(
          menu?.properties?.find((p) => p.name === 'expanded')?.value.value,
        ).toBe(true);
        await page.locator('summary').press('Escape');
        await expect(page.locator('summary')).toBeFocused();
      }
    }
  });

  test(`hover, open navigation, forced colors: ${route}`, async ({ page }) => {
    await page.goto(route);
    const primary = page.locator('.header-join .button');
    await primary.hover();
    expect(
      (await new AxeBuilder({ page }).withRules(['color-contrast']).analyze())
        .violations,
    ).toEqual([]);
    await page.setViewportSize({ width: 320, height: 900 });
    await page.locator('summary').press('Enter');
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.emulateMedia({
      forcedColors: 'active',
      reducedMotion: 'reduce',
    });
    await expect(
      page.getByRole('navigation', { name: 'Navegação móvel' }),
    ).toBeVisible();
    await page.locator('summary').press('Escape');
    expect(
      await page
        .locator('summary')
        .evaluate((el) => getComputedStyle(el).outlineStyle),
    ).not.toBe('none');
  });
}
