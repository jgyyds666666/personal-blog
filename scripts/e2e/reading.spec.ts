import { test, expect } from '@playwright/test';

const content = [
  '# 阅读示例',
  '标题和正文之间没有空行，也应正常渲染。',
  '| 名称 | 内容 |',
  '| --- | --- |',
  '| 简单表格 | 手机上完整显示 |',
  '| 缺列的行 |',
  '',
  '| 项目 | 说明 | 价格 | 日期 | 状态 | 备注 |',
  '| --- | --- | ---: | --- | --- | --- |',
  '| 宽表格 | 支持独立滑动 | 100 | 2026-10-13 | 正常 | 最后一列完整可读 |',
  '',
  `长链接：https://example.com/${'very-long-url-'.repeat(35)}`,
  '',
  `行内代码：\`${'longIdentifier'.repeat(35)}\``,
  '',
  '- 第一项',
  '- 第二项',
  '  - [x] 子任务',
  '3. 第三个步骤',
  '4. 第四个步骤',
  '',
  '```typescript',
  `const example = "${'code-'.repeat(80)}";`,
  '```',
  ...Array.from({ length: 45 }, (_, index) => `\n## 第 ${index + 1} 节\n${'这是一段用于验证手机阅读、目录定位和正文换行的内容。'.repeat(12)}`),
].join('\n');

test.beforeEach(async ({ request }) => {
  const response = await request.patch('http://127.0.0.1:54329/__test/post', { data: { content } });
  expect(response.ok()).toBe(true);
});

test('mobile articles fit the viewport; tables scroll separately and the directory remains reachable', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const width of [320, 375, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/posts/public-reading-test');
    await expect(page.getByRole('button', { name: '查看文章目录', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '打开文章目录', exact: true })).toBeVisible();
    await expect(page.locator('.post-content h1')).toHaveText('阅读示例');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    const simple = page.locator('.table-scroll').first();
    expect(await simple.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    await expect(simple.locator('td').filter({ hasText: '缺列的行' })).toBeVisible();
    await expect(simple.locator('..').locator('.table-scroll-hint')).toBeHidden();
    const wide = page.locator('.table-scroll').nth(1);
    await expect(wide.locator('..').locator('.table-scroll-hint')).toBeVisible();
    await expect(wide).toHaveAttribute('tabindex', '0');
    await wide.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await wide.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
    await expect(wide.locator('..')).toHaveAttribute('data-end', 'true');
    expect(await wide.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/reading-tables-${width}.png`, animations: 'disabled' });

    await page.getByRole('button', { name: '打开文章目录', exact: true }).click();
    const dialog = page.getByRole('dialog');
    const nav = dialog.getByRole('navigation', { name: '文章目录' });
    await expect(dialog).toBeVisible();
    await expect(nav.getByRole('link')).toHaveCount(46);
    await expect(nav.getByRole('link', { name: '阅读示例', exact: true })).toHaveAttribute('aria-current', 'location');
    const before = await page.evaluate(() => window.scrollY);
    await nav.evaluate((element) => { element.scrollTop = element.scrollHeight; });
    await expect(nav.getByRole('link', { name: '第 45 节', exact: true })).toBeVisible();
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
    if (width === 390) await page.screenshot({ path: 'test-results/reading-mobile-directory.png', animations: 'disabled' });
    await nav.getByRole('link', { name: '第 45 节', exact: true }).click();
    await expect(dialog).toBeHidden();
    const heading = page.getByRole('heading', { name: '第 45 节', exact: true });
    await expect(heading).toBeVisible();
    expect(await heading.evaluate((element) => element.getBoundingClientRect().top)).toBeGreaterThanOrEqual(64);
    await page.getByRole('button', { name: '打开文章目录', exact: true }).click();
    await expect(nav.getByRole('link', { name: '第 45 节', exact: true })).toHaveAttribute('aria-current', 'location');
    await expect(nav.getByRole('link', { name: '第 45 节', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  }
  expect(errors).toEqual([]);
});

test('desktop directory scrolls independently and lists, alignment, code copy and article progress work', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/posts/public-reading-test');
  const nav = page.getByRole('navigation', { name: '文章目录' });
  await expect(nav).toBeVisible();
  await expect(page.getByRole('button', { name: '打开文章目录', exact: true })).toBeHidden();
  const before = await page.evaluate(() => window.scrollY);
  await nav.evaluate((element) => { element.scrollTop = element.scrollHeight; });
  expect(await page.evaluate(() => window.scrollY)).toBe(before);
  await nav.getByRole('link', { name: '第 45 节', exact: true }).click();
  await expect(nav.getByRole('link', { name: '第 45 节', exact: true })).toHaveAttribute('aria-current', 'location');
  expect(await page.getByRole('heading', { name: '第 45 节', exact: true }).evaluate((element) => element.getBoundingClientRect().top)).toBeGreaterThanOrEqual(64);
  await page.screenshot({ path: 'test-results/reading-desktop-directory.png', animations: 'disabled' });

  const list = page.locator('.post-content > ul').first();
  expect(await list.evaluate((element) => getComputedStyle(element).listStyleType)).toBe('disc');
  expect(await page.locator('.post-content ol').evaluate((element) => getComputedStyle(element).listStyleType)).toBe('decimal');
  expect(await page.locator('.post-content ul.task-list').evaluate((element) => getComputedStyle(element).listStyleType)).toBe('none');
  expect(await page.locator('td').filter({ hasText: /^100$/ }).evaluate((element) => getComputedStyle(element).textAlign)).toBe('right');
  const copy = page.getByRole('button', { name: '复制代码', exact: true });
  await copy.click();
  await expect(copy).toHaveText('已复制');
  await page.locator('[data-reading-content]').evaluate((element) => window.scrollTo(0, element.getBoundingClientRect().bottom + window.scrollY - window.innerHeight));
  await expect(page.locator('[aria-hidden="true"] > div[style]')).toHaveAttribute('style', /width: 100%/);
});

test('private reading shares the mobile directory and table behavior; plain text stays literal', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto('/login?next=/');
  await page.getByLabel('后台密码', { exact: true }).fill('document-test-password');
  await page.getByRole('button', { name: '登录并返回首页' }).click();
  await expect(page).toHaveURL('http://127.0.0.1:5137/');
  const uploaded = await page.request.post('/api/documents', { multipart: { file: { name: '手机阅读测试.md', mimeType: 'text/markdown', buffer: Buffer.from(content) } } });
  expect(uploaded.status()).toBe(201);
  const result = await uploaded.json() as { data: { id: string } };
  try {
    await page.goto(`/documents/${result.data.id}`);
    await expect(page.getByRole('button', { name: '查看文章目录', exact: true })).toBeVisible();
    await expect(page.locator('.table-scroll').nth(1).locator('..').locator('.table-scroll-hint')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByRole('button', { name: '打开文章目录', exact: true }).click();
    await expect(page.getByRole('dialog').getByRole('link')).toHaveCount(46);
    await page.keyboard.press('Escape');
    await page.screenshot({ path: 'test-results/reading-private-mobile.png', animations: 'disabled' });
  } finally {
    expect((await page.request.delete(`/api/documents/${result.data.id}`)).ok()).toBe(true);
  }
  const plainText = '# 保持原样\n**不会变成粗体**';
  const text = await page.request.post('/api/documents', { multipart: { file: { name: '手机纯文本.txt', mimeType: 'text/plain', buffer: Buffer.from(plainText) } } });
  const textResult = await text.json() as { data: { id: string } };
  try {
    await page.goto(`/documents/${textResult.data.id}`);
    await expect(page.locator('.post-content')).toHaveText(plainText);
    await expect(page.getByRole('button', { name: '打开文章目录', exact: true })).toHaveCount(0);
    await expect(page.locator('.post-content h1, .post-content strong')).toHaveCount(0);
  } finally {
    expect((await page.request.delete(`/api/documents/${textResult.data.id}`)).ok()).toBe(true);
  }
  await page.request.patch('http://127.0.0.1:54329/__test/post', { data: { content: '没有标题的普通正文' } });
  await page.goto('/posts/public-reading-test');
  await expect(page.getByRole('button', { name: '打开文章目录', exact: true })).toHaveCount(0);
});
