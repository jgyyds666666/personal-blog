import assert from 'node:assert/strict';
import { renderMarkdown } from '../src/lib/markdown';

const fence = '`'.repeat(3);
const markdown = [
  '## 标题 **加粗**',
  '',
  '- [x] 已完成 `代码`',
  '- [ ] 未完成',
  '',
  '| 名称 | 数量 |',
  '| --- | ---: |',
  '| 苹果 | **2** |',
  '',
  `${fence}typescript`,
  '<script>alert(1)</script>',
  fence,
  '',
  '[危险链接](javascript:alert(1))',
  '',
  '![图片](https://example.com/blog-images/demo%20image.png?signature=expired)',
].join('\n');

const result = renderMarkdown(markdown);

assert.match(result.html, /<h2 id="heading-0">标题 <strong>加粗<\/strong><\/h2>/);
assert.match(result.html, /<ul class="task-list">/);
assert.match(result.html, /<code>代码<\/code>/);
assert.match(result.html, /<table>/);
assert.match(result.html, /<td align="right"><strong>2<\/strong><\/td>/);
assert.match(result.html, /<pre data-language="typescript"><code>&lt;script&gt;alert\(1\)&lt;\/script&gt;<\/code><\/pre>/);
assert.match(result.html, /href="#"/);
assert.match(result.html, /src="\/media\/blog-images\/demo%20image\.png"/);
assert.deepEqual(result.headings, [{ id: 'heading-0', title: '标题 加粗', level: 2 }]);

console.log('Markdown rendering checks passed.');
