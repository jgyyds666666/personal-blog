import assert from 'node:assert/strict';
import { renderMarkdown } from '../src/lib/markdown';

const fence = '`'.repeat(3);
const alternateFence = '~'.repeat(3);
const markdown = [
  '## 标题 **加粗**',
  '',
  '- [x] 已完成 `代码`',
  '- [ ] 未完成',
  '  - 嵌套列表 [参考文档][docs]',
  '',
  '| 名称 | 数量 |',
  '| --- | ---: |',
  '| 苹果 | **2** |',
  '',
  `${fence}typescript`,
  '<script>alert(1)</script>',
  fence,
  '',
  `${alternateFence}css`,
  '.demo { color: red; }',
  alternateFence,
  '',
  '[危险链接](javascript:alert(1))',
  '[下划线链接](https://example.com/a_b?q=x_y)',
  '<https://example.com/auto_link>',
  '',
  '![图片](https://example.com/blog-images/demo%20image.png?signature=expired)',
  '',
  '[docs]: https://example.com/reference_path',
].join('\n');

const result = renderMarkdown(markdown);

assert.match(result.html, /<h2 id="heading-0">标题 <strong>加粗<\/strong><\/h2>/);
assert.match(result.html, /<ul class="task-list">/);
assert.match(result.html, /<code>代码<\/code>/);
assert.match(result.html, /嵌套列表 <a href="https:\/\/example\.com\/reference_path"/);
assert.match(result.html, /<table>/);
assert.match(result.html, /<td style="text-align:right"><strong>2<\/strong><\/td>/);
assert.match(result.html, /<pre data-language="typescript"><code>&lt;script&gt;alert\(1\)&lt;\/script&gt;\s*<\/code><\/pre>/);
assert.match(result.html, /<pre data-language="css"><code>\.demo \{ color: red; \}\s*<\/code><\/pre>/);
assert.doesNotMatch(result.html, /href="javascript:/);
assert.match(result.html, /href="https:\/\/example\.com\/a_b\?q=x_y"/);
assert.match(result.html, /href="https:\/\/example\.com\/auto_link"/);
assert.match(result.html, /src="\/media\/blog-images\/demo%20image\.png"/);
assert.deepEqual(result.headings, [{ id: 'heading-0', title: '标题 加粗', level: 2 }]);

const compact = renderMarkdown('# 第一章\n正文\n## **第二节** & 内容\n### `第三节`\n正文\n#### 第四节\n##### 第五节\n###### 第六节');
assert.deepEqual(compact.headings.map(({ title, level }) => ({ title, level })), [
  { title: '第一章', level: 1 }, { title: '第二节 & 内容', level: 2 }, { title: '第三节', level: 3 },
  { title: '第四节', level: 4 }, { title: '第五节', level: 5 }, { title: '第六节', level: 6 },
]);
assert.match(compact.html, /<h1 id="heading-0">第一章<\/h1>\s*<p>正文<\/p>/);
assert.equal(renderMarkdown('普通正文，没有标题').headings.length, 0);
assert.equal(renderMarkdown('标题\n===\n正文').headings[0]?.level, 1);
assert.equal(new Set(renderMarkdown('## 重复\n## 重复').headings.map((heading) => heading.id)).size, 2);
assert.equal(renderMarkdown('# 一级\n## 二级', { includeTopLevelHeadings: false }).headings[0]?.title, '二级');

const table = renderMarkdown('下面是表格\n| 名称 | 内容 |\n| --- | --- |\n| 正常 | 说明 |\n| 缺列 |\n| 多列 | 说明 | 多余 |\n\n表格之后的正文');
assert.match(table.html, /<p>下面是表格<\/p>\s*<div class="table-scroll">/);
assert.match(table.html, /<td>缺列<\/td>\s*<td><\/td>/);
assert.match(table.html, /<td>多列<\/td>\s*<td>说明<\/td>/);
assert.match(table.html, /<p>表格之后的正文<\/p>/);
const wide = renderMarkdown('| 一 | 二 | 三 | 四 |\n| --- | --- | --- | --- |\n| a | b | c | d |');
assert.match(wide.html, /<table class="wide-table">/);
assert.match(renderMarkdown('| 值 |\n| --- |\n| a\\|b |').html, /<td>a\|b<\/td>/);

const blocks = renderMarkdown(['前文', `${fence}js`, '## 代码中的标题', '<script>x</script>', fence, '后文'].join('\n'));
assert.equal(blocks.headings.length, 0);
assert.match(blocks.html, /<p>前文<\/p>\s*<pre/);
assert.match(blocks.html, /<p>后文<\/p>/);
assert.match(renderMarkdown('3. 第三个\n4. 第四个').html, /<ol start="3">/);
assert.match(renderMarkdown('- 父列表\n  - [x] **子任务**').html, /<ul class="task-list">\s*<li><input type="checkbox" disabled checked> <strong>子任务<\/strong>/);

const unsafe = renderMarkdown('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[x](javascript:alert(1))\n\n![x](data:image/svg+xml,test)\n\n[x](//evil.example)');
assert.doesNotMatch(unsafe.html, /<script|<img|href="(?:javascript:|data:|\/\/)/i);
assert.match(renderMarkdown('[站内](/posts/abc)').html, /<a href="\/posts\/abc">/);
assert.match(renderMarkdown('![私有图片](/api/documents/id/assets/image)').html, /src="\/api\/documents\/id\/assets\/image"/);
assert.match(renderMarkdown('# \\<img\\> &amp; **文字**').headings[0]?.title || '', /<img> & 文字/);

console.log('Markdown checks passed: compact headings, all levels, tables, nested tasks, code, image routes and unsafe content.');
