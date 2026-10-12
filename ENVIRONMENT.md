# 文章服务配置

首页和文章后台依赖 Supabase。若首页显示“文章暂时无法加载”，先访问 `/api/health`：

- `{"ok":true,"status":"ready"}`：服务和数据库连接正常。
- `configuration`：部署环境缺少 Supabase 变量。
- `database`：变量已配置，但数据库连接、权限或 `posts` 表存在问题。

## 本地开发

复制 `.env.example` 为 `.env.local`，再填入实际值：

```text
COZE_SUPABASE_URL=
COZE_SUPABASE_ANON_KEY=
COZE_SUPABASE_SERVICE_ROLE_KEY=
BLOG_ADMIN_PASSWORD=
BLOG_AUTH_SECRET=
BLOG_SITE_URL=https://你的域名
```

重启开发服务器后生效。

## 部署环境

在部署平台的环境变量设置中配置相同的三个变量后，重新部署应用。

`COZE_SUPABASE_SERVICE_ROLE_KEY` 只能用于服务端，不能使用 `NEXT_PUBLIC_` 前缀，也不能提交到仓库。

## SEO 与内容分发

`BLOG_SITE_URL` 用于生成 canonical、Open Graph、站点地图和 RSS 地址。部署到线上后请填写完整的 HTTPS 域名，否则会回退到本地开发地址。

- 站点地图：`/sitemap.xml`
- RSS 订阅：`/rss.xml`

## 后台登录

文章管理页和写作、编辑、删除、上传接口都需要登录。请在本地和部署环境同时设置：

```text
BLOG_ADMIN_PASSWORD=设置一个强密码
BLOG_AUTH_SECRET=设置一个长随机字符串
```

配置完成并重启服务后，访问 `/login` 登录后台。两个变量缺失时，登录接口会提示配置未完成，不会开放后台访问。

## 图片地址

编辑器上传的图片会保存为站内 `/media/...` 地址。访问该地址时，服务端会为对象生成新的临时签名，因此文章不会因为编辑时生成的签名过期而丢图。历史文章中的 `blog-images/` 签名地址也会在渲染时自动转换。

## 私人文档初始化

私人文档支持 `.md`、`.txt` 和 `.docx`，单个文件最多 10MB。登录后可在首页上传，上传完成留在首页，点击列表中的文档进入阅读页面。

首次使用前，在 Supabase SQL Editor 执行 `scripts/migrations/001-private-documents.sql`。脚本会创建独立的文档表和私有存储桶，并禁止匿名和普通 Supabase 用户访问。该功能必须配置 `COZE_SUPABASE_SERVICE_ROLE_KEY`，缺失时会拒绝存储文档，不会降级使用匿名密钥。

如果上传日志出现 `PGRST204 Could not find the 'assets' column of 'private_documents' in the schema cache`，在同一数据库执行 `scripts/migrations/002-private-documents-assets.sql`。该脚本补齐 Word 图片索引所需的 `assets` 列，并通知 PostgREST 刷新数据库结构缓存；可重复执行，不会重建表或删除文档。完成后返回首页重试上传。

正文、原文件和 Word 内嵌图片只通过需要后台登录的站内地址读取，不提供公开文件地址。公开文章查询、RSS 和站点地图继续只读取 `posts` 表。

Word 的字体、页眉页脚、分页和复杂布局会简化；普通标题、列表、链接、表格和受支持的内嵌图片会转换到博客样式。UTF-8、带 BOM 的 UTF-16 和常见 GB18030 中文文本可导入；Markdown 中引用的本地图片需要另行提供，单独上传 Markdown 文件不会同时上传其目录。

验证命令：`pnpm validate`。浏览器测试使用独立的本地模拟数据库和存储，不连接真实 Supabase：先运行 `pnpm exec playwright install chromium`，再运行 `pnpm test:documents:e2e`。Windows 已安装 Edge 时，可设置 `$env:DOCUMENT_TEST_BROWSER='msedge'` 后直接运行浏览器测试。

部署使用 Next.js 默认的 Turbopack 构建。Coze SDK 和 `pg` 随服务端代码打包，不能将 SDK 配置为外置包，否则扣子 FaaS 可能无法加载其外置模块。生产验证先执行 `pnpm exec next build`，再设置 `DOCUMENT_TEST_PRODUCTION=1` 运行 `pnpm test:documents:e2e`，测试会启动构建后的生产服务。

公开文章详情页采用动态渲染，每次请求读取已发布文章。扣子 FaaS 的部署目录无法保证写入 ISR 缓存，因此文章页不使用定时重建和构建时预渲染，避免 `Failed to update prerender cache` 与 `.segments` 目录写入错误。
