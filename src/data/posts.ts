export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
  readingTime: string;
  content: string;
  cover?: string;
}

export const posts: Post[] = [
  {
    slug: 'hello-world',
    title: '你好，世界——开博第一篇',
    excerpt:
      '为什么我决定开始写博客？在这个信息爆炸的时代，写作还有意义吗？这篇文章聊聊我对写作和思考的一些看法。',
    date: '2024-12-15',
    tags: ['随笔', '写作'],
    readingTime: '5 分钟',
    content: `
## 为什么要写博客

在短视频和即时通讯充斥的今天，静下心来写一篇长文似乎变得越来越奢侈。但我始终相信，写作是思考最好的方式——它迫使你把模糊的想法梳理清楚，把零散的认知串联成体系。

## 这个博客会写什么

我计划在这里记录以下几类内容：

- **技术笔记**：编程、架构、工具使用心得
- **读书摘抄**：读过的好书，以及它们带给我的启发
- **生活随笔**：偶尔的感悟和思考
- **项目记录**：做过的一些有趣的小项目

## 写在最后

如果你碰巧来到这里，又碰巧读到了这里，那真是一种缘分。欢迎在评论区留下你的想法，或者只是悄悄地来，悄悄地走。

> 写作不是为了被阅读，而是为了更清晰地思考。
`,
  },
  {
    slug: 'react-19-new-features',
    title: 'React 19 新特性深度解读',
    excerpt:
      'React 19 带来了许多令人期待的新特性：Actions、use() hook、文档元数据 API……让我们一起来看看这些变化将如何改变我们的开发方式。',
    date: '2024-12-10',
    tags: ['前端', 'React', '技术'],
    readingTime: '8 分钟',
    content: `
## React 19 概览

React 19 是一个重要的版本更新，它引入了许多新特性，旨在简化开发流程并提升应用性能。

## Actions

Actions 是 React 19 中最重要的新概念之一。它允许你在表单提交等异步操作中更优雅地处理加载状态和乐观更新。

\`\`\`jsx
function UpdateName() {
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      const error = await updateName(name);
      if (error) {
        setError(error);
        return;
      } 
      redirect("/path");
    });
  };

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={handleSubmit} disabled={isPending}>
        更新
      </button>
      {error && <p>{error}</p>}
    </div>
  );
}
\`\`\`

## use() Hook

新的 \`use()\` hook 让你可以在渲染过程中读取资源（如 Promise 或 Context），这为 Suspense 和数据获取带来了更多可能性。

## 文档元数据 API

现在你可以在组件中直接渲染 \`<title>\`、\`<meta>\` 等标签，React 会自动将它们提升到文档的 \`<head>\` 中。

## 总结

React 19 的这些变化标志着 React 正在朝着更简洁、更强大的方向发展。作为开发者，我们需要持续学习以跟上这些变化的步伐。
`,
  },
  {
    slug: 'reading-list-2024',
    title: '2024 年度阅读书单分享',
    excerpt:
      '今年读了 32 本书，有技术类的，也有文学和哲学类的。挑选出最值得推荐的 10 本分享给大家，每一本都让我受益匪浅。',
    date: '2024-12-05',
    tags: ['读书', '年度总结'],
    readingTime: '12 分钟',
    content: `
## 写在前面

2024 年对我来说是阅读量很大的一年。总共读完了 32 本书，平均每个月 2-3 本。下面是我精挑细选的 10 本最推荐的书。

## 技术类

### 《设计模式：可复用面向对象软件的基础》

经典中的经典。虽然出版于 1994 年，但其中的设计思想至今仍然熠熠生辉。每读一遍都有新的收获。

### 《代码整洁之道》

写代码和写文章一样，讲究清晰和优雅。这本书教你如何写出让人读起来舒服的代码。

## 人文类

### 《人类简史》

从认知革命到科学革命，尤瓦尔·赫拉利用宏大的视角重新讲述了人类的故事。读完之后你会对"我们是谁"有全新的认识。

### 《沉思录》

马可·奥勒留的私人日记。两千年前的文字，今天读来依然有直指人心的力量。

## 小说类

### 《百年孤独》

马尔克斯的代表作。魔幻现实主义的巅峰之作，需要耐心但绝对值得。

## 结语

读书是成本最低的自我投资。希望明年能读更多好书，也欢迎大家在评论区推荐你们今年读过的好书。
`,
  },
  {
    slug: 'minimalism-lifestyle',
    title: '极简生活一年后，我学到了什么',
    excerpt:
      '一年前我开始尝试极简主义生活，从整理衣柜开始，逐渐扩展到工作、人际关系甚至思维方式。这篇文章聊聊极简主义对我的改变。',
    date: '2024-11-28',
    tags: ['生活', '极简主义'],
    readingTime: '6 分钟',
    content: `
## 什么是极简主义

极简主义不是清贫，而是"只保留真正重要的东西"。它是一种选择——选择把时间、精力和空间留给那些真正对你有价值的人和事。

## 我是怎么开始的

一切始于一次衣柜整理。我发现自己有很多衣服一年都没穿过一次，但每天早上还是要花很长时间决定穿什么。于是我开始扔东西……

## 物质层面

**衣柜精简**：从 120 件衣服减少到 35 件。好处是：选择变少了，但每一件都是喜欢的。

**数字极简**：手机 App 从 80+ 减到 25 个。关闭了几乎所有通知。注意力回来了。

## 精神层面

**学会说不**：不再参加所有聚会，不再答应所有请求。时间变得更可控了。

**专注当下**：少即是多。做更少的事，但把每件事做得更好。

## 写在最后

极简主义不是目的，而是手段。通过减少外在的干扰，你才能更清楚地听到自己内心的声音。

> 拥有的越少，越富有。—— 梭罗
`,
  },
  {
    slug: 'typescript-tips',
    title: '十个让你 TypeScript 水平飙升的技巧',
    excerpt:
      '用了三年 TypeScript 后总结出的 10 个实用技巧，从类型体操到工程实践，总有一个你不知道的。',
    date: '2024-11-20',
    tags: ['前端', 'TypeScript', '技术'],
    readingTime: '10 分钟',
    content: `
## 前言

TypeScript 已经成为前端开发的标配。但很多人只是把它当成"加了类型注解的 JavaScript"，没有发挥出它的真正威力。

## 技巧 1：使用 satisfies 代替 as

\`\`\`typescript
// ❌ 不好：丢失类型信息
const config = {
  url: "https://api.example.com",
  timeout: 5000,
} as const;

// ✅ 好：保留推断同时验证类型
const config = {
  url: "https://api.example.com",
  timeout: 5000,
} satisfies Record<string, string | number>;
\`\`\`

## 技巧 2：模板字面量类型

\`\`\`typescript
type EventName = \`on\${Capitalize<string>}\`;
// 'onFoo' | 'onBar' | ...
\`\`\`

## 技巧 3：使用 const 泛型

\`\`\`typescript
function useItems<const T extends readonly string[]>(items: T): T {
  return items;
}

const items = useItems(["a", "b", "c"] as const);
// typeof items = readonly ["a", "b", "c"]
\`\`\`

## 技巧 4：条件类型推断

\`\`\`typescript
type Awaited<T> = T extends Promise<infer U> ? U : T;
\`\`\`

## 技巧 5：分布式条件类型

当泛型参数是联合类型时，条件类型会自动分发。

\`\`\`
type ToArray<T> = T extends any ? T[] : never;
type StrArrOrNumArr = ToArray<string | number>;
// string[] | number[]
\`\`\`

## 结语

TypeScript 的类型系统非常强大，掌握这些技巧能让你写出更安全、更优雅的代码。
`,
  },
  {
    slug: 'remote-work-tips',
    title: '远程工作三年的效率心得',
    excerpt:
      '从朝九晚五到完全远程，我花了很长时间才找到适合自己的节奏。分享一些让远程工作更高效、更健康的心得。',
    date: '2024-11-10',
    tags: ['工作', '效率'],
    readingTime: '7 分钟',
    content: `
## 远程工作的挑战

远程工作听起来很美好：不用通勤、时间自由、穿着睡衣就能上班。但实际做起来会发现挑战很多：自律、沟通、边界感……

## 工作环境

**专门的工作空间**：一定要有一个固定的工作区域。床和沙发是工作的敌人。

**正确的设备**：一把好椅子、一个外接显示器、一副降噪耳机——这些投资绝对值得。

## 时间管理

**番茄工作法**：25 分钟专注 + 5 分钟休息。简单但有效。

**时间块规划**：把一天分成几个大块，每个大块只做一类事情。

## 沟通协作

**异步优先**：能发消息就不要开会，能写文档就不要发语音。

**过度沟通**：远程工作中，"过度沟通"通常是褒义词。多同步进度，多汇报状态。

## 身心健康

**定时运动**：没有了通勤的步行，运动量会骤降。务必安排专门的运动时间。

**社交活动**：远程工作容易让人变得孤僻。定期和朋友见面、参加线下活动很重要。

## 结语

远程工作是一种能力，需要刻意练习才能掌握。希望这些经验对你有帮助。
`,
  },
];

export function getPostBySlug(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug);
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  posts.forEach((post) => post.tags.forEach((tag) => tags.add(tag)));
  return Array.from(tags);
}

export function getPostsByTag(tag: string): Post[] {
  return posts.filter((post) => post.tags.includes(tag));
}
