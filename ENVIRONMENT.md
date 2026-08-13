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
```

重启开发服务器后生效。

## 部署环境

在部署平台的环境变量设置中配置相同的三个变量后，重新部署应用。

`COZE_SUPABASE_SERVICE_ROLE_KEY` 只能用于服务端，不能使用 `NEXT_PUBLIC_` 前缀，也不能提交到仓库。

## 后台登录

文章管理页和写作、编辑、删除、上传接口都需要登录。请在本地和部署环境同时设置：

```text
BLOG_ADMIN_PASSWORD=设置一个强密码
BLOG_AUTH_SECRET=设置一个长随机字符串
```

配置完成并重启服务后，访问 `/login` 登录后台。两个变量缺失时，登录接口会提示配置未完成，不会开放后台访问。
