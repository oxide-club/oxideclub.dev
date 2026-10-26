import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const route='/roadmaps/concorrencia-sincronizacao-e-execucao-assincrona/';
test('catalogue and diagram lead to canonical materials and retain the alternate list',async({page})=>{
 await page.goto('/roadmaps/');await expect(page.locator('[data-roadmap-card]')).toHaveCount(10);
 await page.locator('[data-roadmap-card] a').filter({hasText:'Concorrência'}).click();
 await expect(page.locator('[data-roadmap-diagram]')).toHaveAttribute('data-ready','true');
 await expect(page.locator('[data-roadmap-node]')).toHaveCount(5);
 await page.getByRole('button',{name:'Lista',exact:true}).click();
 await expect(page.locator('[data-roadmap-list]')).toBeVisible();
 const link=page.locator('[data-roadmap-list] a[href="/labs/010-concurrency-lab/"]').first();await link.click();await expect(page).toHaveURL(/\/labs\/010-concurrency-lab\/$/);
});
for(const width of [320,390,768,1280])test(`roadmaps remain accessible at ${width}px and 200% text`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto(route);await expect(page.locator('[data-roadmap-diagram]')).toHaveAttribute('data-ready','true');
 expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.evaluate(()=>{const items=[...document.querySelectorAll<HTMLElement>('[data-roadmap-node], [data-roadmap-node] *')].map(el=>({el,size:parseFloat(getComputedStyle(el).fontSize)}));for(const {el,size}of items)el.style.fontSize=`${size*2}px`});
 await expect.poll(async()=>page.locator('[data-roadmap-node]').evaluateAll(nodes=>nodes.every(n=>n.scrollHeight<=n.clientHeight+1))).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Lista',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.locator('[data-roadmap-list]')).toBeVisible();
});
test('without JavaScript the full curriculum and relations remain navigable',async({browser,baseURL})=>{const context=await browser.newContext({javaScriptEnabled:false,baseURL});try{const page=await context.newPage();await page.goto(route);await expect(page.locator('[data-roadmap-list]')).toBeVisible();await expect(page.locator('[data-roadmap-list] [data-material]')).toHaveCount(5);await expect(page.getByRole('button',{name:'Diagrama',exact:true})).toBeHidden();await expect(page.locator('[data-roadmap-list]')).toContainText('Convergência')}finally{await context.close()}});
