import { test, expect } from '@playwright/test';

test('published articles reflect database updates without writing an ISR cache', async ({ page, playwright }) => {
  const mock = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:54329' });
  try {
    await page.goto('/posts/public-reading-test');
    await expect(page.getByRole('heading', { name: '公开文章测试', exact: true })).toBeVisible();
    await expect(page.locator('.post-content')).toContainText('原始正文');
    await mock.patch('/__test/post', { data: { content: '# 最新正文\n\n数据库更新后立即可见。' } });
    const article = await page.request.get('/posts/public-reading-test');
    expect(article.status()).toBe(200);
    expect(article.headers()['cache-control']).toContain('no-store');
    expect(await article.text()).toContain('数据库更新后立即可见。');
  } finally {
    await mock.patch('/__test/post', { data: { content: '# 原始正文\n\n公开文章内容。' } });
    await mock.dispose();
  }
});

test('missing assets column prompts migration and removes files from failed uploads', async ({ page, playwright }) => {
  const mock = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:54329' });
  await page.goto('/login?next=/');
  await page.getByLabel('后台密码', { exact: true }).fill('document-test-password');
  await page.getByRole('button', { name: '登录并返回首页' }).click();
  await expect(page).toHaveURL('http://127.0.0.1:5137/');
  const before: unknown = await (await mock.get('/__test/state')).json();
  try {
    await mock.post('/__test/schema', { data: { assets: false } });
    const upload = await page.request.post('/api/documents', {
      multipart: { file: { name: '表结构测试.txt', mimeType: 'text/plain', buffer: Buffer.from('文档正文') } },
    });
    expect(upload.status()).toBe(503);
    expect(await upload.json()).toEqual({ success: false, error: '私人文档数据库结构尚未更新，请完成数据库迁移并刷新结构缓存后重试。' });
    expect(await (await mock.get('/__test/state')).json()).toEqual(before);
  } finally {
    await mock.post('/__test/schema', { data: { assets: true } });
    await mock.dispose();
  }
});
