import { test, expect } from '@playwright/test';

const postId = '7b6c3035-50b1-4ed3-8a39-f8be72f018d2';
const storageKey = `moxiang:reading:post:${postId}`;
const content = ['# 阅读测试', ...Array.from({ length: 25 }, (_, index) => `\n## 第 ${index + 1} 节\n${'这一节用于验证阅读位置在不同手机宽度下的恢复。'.repeat(18)}`)].join('\n');

test.beforeEach(async ({ request }) => {
  expect((await request.patch('http://127.0.0.1:54329/__test/post', { data: { content } })).ok()).toBe(true);
});

test('image previews zoom, pan, reset, close and return focus without changing linked images', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const imageContent = '![阅读示意](/media/blog-images/reading-preview.png)\n\n[![链接图片](/media/blog-images/reading-preview.png)](https://example.com/resource)\n\n| 项目 | 内容 |\n| --- | --- |\n| 验证 | 保留表格交互 |\n\n```text\n保留代码复制\n```\n\n' + content;
  await page.request.patch('http://127.0.0.1:54329/__test/post', { data: { content: imageContent } });
  await page.route('**/media/blog-images/reading-preview.png', (route) => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><rect width="960" height="540" fill="#e7e2d8"/><rect x="30" y="30" width="430" height="230" rx="20" fill="#b45309"/><rect x="500" y="30" width="430" height="230" rx="20" fill="#1d4f7a"/><rect x="30" y="290" width="430" height="220" rx="20" fill="#78716c"/><rect x="500" y="290" width="430" height="220" rx="20" fill="#3f3f46"/><text x="245" y="165" text-anchor="middle" font-size="90" fill="white">1</text><text x="715" y="165" text-anchor="middle" font-size="90" fill="white">2</text><text x="245" y="435" text-anchor="middle" font-size="90" fill="white">3</text><text x="715" y="435" text-anchor="middle" font-size="90" fill="white">4</text></svg>' }));
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/posts/public-reading-test');
    await expect(page.locator('.image-preview-trigger')).toHaveCount(1);
    await expect(page.locator('.post-content a').filter({ has: page.getByRole('img', { name: '链接图片', exact: true }) })).toHaveAttribute('href', 'https://example.com/resource');
    const trigger = page.getByRole('button', { name: '查看大图：阅读示意', exact: true });
    await trigger.scrollIntoViewIfNeeded();
    const scrollY = await page.evaluate(() => window.scrollY);
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const image = dialog.getByRole('img', { name: '阅读示意', exact: true });
    await expect.poll(() => image.evaluate((element) => element.style.width)).not.toBe('');
    await expect(dialog.getByText('100%', { exact: true })).toBeVisible();
    const initial = await image.evaluate((element) => element.getBoundingClientRect().width);
    await dialog.getByRole('button', { name: '放大图片', exact: true }).click();
    await dialog.getByRole('button', { name: '放大图片', exact: true }).click();
    await expect(dialog.getByText('200%', { exact: true })).toBeVisible();
    expect(await image.evaluate((element) => element.getBoundingClientRect().width)).toBeGreaterThan(initial * 1.9);
    const viewport = dialog.getByLabel('图片预览，可滑动查看', { exact: true });
    expect(await viewport.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
    await viewport.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
    expect(await viewport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    await dialog.getByRole('button', { name: '重置图片缩放', exact: true }).click();
    await expect(dialog.getByText('100%', { exact: true })).toBeVisible();
    if (width === 390) await page.screenshot({ path: 'test-results/reading-image-preview.png', animations: 'disabled' });
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(page.locator('.table-block')).toHaveCount(1);
    await expect(page.getByRole('button', { name: '复制代码', exact: true })).toHaveCount(1);
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
    await trigger.click();
    await expect(dialog.getByText('100%', { exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: '关闭图片预览', exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.route('**/media/blog-images/reading-preview.png', (route) => route.fulfill({ status: 404 }), { times: 2 });
  await page.reload();
  await page.getByRole('button', { name: '查看大图：阅读示意', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('图片加载失败');
  await page.getByRole('button', { name: '关闭图片预览', exact: true }).click();
  expect(errors).toEqual([]);
});

test('article progress survives a fresh tab and a viewport change; chapter links take precedence', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto('/posts/public-reading-test');
  await page.getByRole('button', { name: '打开文章目录', exact: true }).click();
  await page.getByRole('dialog').getByRole('link', { name: '第 12 节', exact: true }).click();
  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), storageKey)).not.toBeNull();
  const raw = await page.evaluate((key) => window.localStorage.getItem(key), storageKey);
  const saved = JSON.parse(raw!) as Record<string, unknown>;
  expect(Object.keys(saved).sort()).toEqual(['contentVersion', 'headingId', 'progress', 'sectionProgress', 'updatedAt', 'version'].sort());
  expect(saved.headingId).toBe('heading-12');
  await page.getByRole('link', { name: '返回文章列表', exact: false }).click();
  const fresh = await page.context().newPage();
  await fresh.setViewportSize({ width: 430, height: 844 });
  try {
    await fresh.goto('/posts/public-reading-test');
    await expect(fresh.getByRole('status', { name: '继续上次阅读' })).toBeVisible();
    expect(await fresh.evaluate(() => window.scrollY)).toBe(0);
    await fresh.screenshot({ path: 'test-results/reading-resume-prompt.png', animations: 'disabled' });
    await fresh.getByRole('button', { name: '继续阅读', exact: true }).click();
    await expect(fresh.getByRole('status', { name: '继续上次阅读' })).toHaveCount(0);
    const heading = fresh.getByRole('heading', { name: '第 12 节', exact: true });
    await expect(heading).toBeVisible();
    const top = await heading.evaluate((element) => element.getBoundingClientRect().top);
    expect(top).toBeGreaterThanOrEqual(64);
    expect(top).toBeLessThan(180);
    await fresh.goto('/posts/public-reading-test#heading-18');
    await expect(fresh.getByRole('status', { name: '继续上次阅读' })).toHaveCount(0);
    await expect(fresh.getByRole('heading', { name: '第 18 节', exact: true })).toBeVisible();
  } finally { await fresh.close(); }
});

test('restart clears the saved position; stale or corrupt records and blocked storage stay harmless', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/posts/public-reading-test');
  await page.evaluate((key) => window.localStorage.setItem(key, JSON.stringify({ version: 1, contentVersion: '2026-10-01T00:00:00Z', progress: 40, headingId: 'heading-10', sectionProgress: 0, updatedAt: Date.now() })), storageKey);
  await page.reload();
  await expect(page.getByRole('status', { name: '继续上次阅读' })).toBeVisible();
  await page.getByRole('button', { name: '从头开始', exact: true }).click();
  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), storageKey)).toBeNull();
  await page.getByRole('button', { name: '打开文章目录', exact: true }).click();
  await page.getByRole('dialog').getByRole('link', { name: '第 12 节', exact: true }).click();
  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), storageKey)).not.toBeNull();
  await page.getByRole('button', { name: '打开文章目录', exact: true }).click();
  await page.getByRole('dialog').getByRole('link', { name: '第 25 节', exact: true }).click();
  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), storageKey)).toBeNull();
  await page.goto('/posts/public-reading-test');
  await page.evaluate((key) => window.localStorage.setItem(key, '{corrupt'), storageKey);
  await page.reload();
  await expect(page.getByRole('status', { name: '继续上次阅读' })).toHaveCount(0);
  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), storageKey)).toBeNull();
  await page.evaluate((key) => window.localStorage.setItem(key, JSON.stringify({ version: 1, contentVersion: 'old-revision', progress: 40, headingId: null, sectionProgress: 0, updatedAt: Date.now() })), storageKey);
  await page.reload();
  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), storageKey)).toBeNull();
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage blocked', 'SecurityError'); } }); });
  await page.reload();
  await expect(page.getByRole('heading', { name: '公开文章测试', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '打开文章目录', exact: true }).click();
  await page.getByRole('dialog').getByRole('link', { name: '第 12 节', exact: true }).click();
  await expect(page.getByRole('heading', { name: '第 12 节', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('private plain text restores progress without storing document content', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto('/login?next=/');
  await page.getByLabel('后台密码', { exact: true }).fill('document-test-password');
  await page.getByRole('button', { name: '登录并返回首页' }).click();
  await expect(page).toHaveURL('http://127.0.0.1:5137/');
  const text = Array.from({ length: 80 }, (_, index) => `第 ${index + 1} 段：${'私人文本仅用于阅读，存储中不应包含正文。'.repeat(16)}`).join('\n\n');
  const uploaded = await page.request.post('/api/documents', { multipart: { file: { name: '私人阅读位置.txt', mimeType: 'text/plain', buffer: Buffer.from(text) } } });
  expect(uploaded.status()).toBe(201);
  const result = await uploaded.json() as { data: { id: string } };
  const key = `moxiang:reading:document:${result.data.id}`;
  try {
    await page.goto(`/documents/${result.data.id}`);
    await page.mouse.wheel(0, 6400);
    await expect.poll(() => page.evaluate((name) => window.localStorage.getItem(name), key)).not.toBeNull();
    const raw = await page.evaluate((name) => window.localStorage.getItem(name), key);
    expect(raw).not.toContain('私人文本');
    const saved = JSON.parse(raw!) as { progress: number; headingId: string | null };
    expect(saved.headingId).toBeNull();
    const fresh = await page.context().newPage();
    await fresh.setViewportSize({ width: 375, height: 844 });
    try {
      await fresh.goto(`/documents/${result.data.id}`);
      await expect(fresh.getByRole('status', { name: '继续上次阅读' })).toBeVisible();
      await fresh.getByRole('button', { name: '继续阅读', exact: true }).click();
      const progress = fresh.locator('[aria-hidden="true"] > div[style]');
      await expect.poll(() => progress.evaluate((element, percentage) => Math.abs(Number.parseFloat(element.style.width) - percentage), saved.progress)).toBeLessThan(1);
    } finally { await fresh.close(); }
  } finally {
    expect((await page.request.delete(`/api/documents/${result.data.id}`)).ok()).toBe(true);
  }
});
