import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '关于',
  description: '关于墨香博客和博主的介绍',
};

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#2c2c2c] mb-8">
        关于我
      </h1>

      <div className="space-y-6 text-[#3f3f46] leading-relaxed">
        <p>
          你好，欢迎来到我的博客。我是一名热爱技术与生活的开发者，在这里记录我的学习、思考和成长。
        </p>

        <div>
          <h2 className="text-xl font-serif font-semibold text-[#2c2c2c] mb-3 mt-8 pb-2 border-b border-[#e7e2d8]">
            关于这个博客
          </h2>
          <p>
            这个博客诞生于一个简单的想法：在喧嚣的互联网上，拥有一个属于自己的小角落。
            不追求流量，不迎合算法，只是安安静静地写，认认真真地想。
          </p>
          <p className="mt-4">
            这里的内容主要包括：
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-1.5">
            <li>前端开发技术笔记与实践心得</li>
            <li>读过的好书和它们带来的启发</li>
            <li>生活中的观察与思考</li>
            <li>一些有趣的小项目记录</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-serif font-semibold text-[#2c2c2c] mb-3 mt-8 pb-2 border-b border-[#e7e2d8]">
            技术栈
          </h2>
          <div className="flex flex-wrap gap-2 mt-4">
            {[
              'TypeScript',
              'React',
              'Next.js',
              'Node.js',
              'Tailwind CSS',
              'PostgreSQL',
              'Docker',
            ].map((tech) => (
              <span
                key={tech}
                className="text-sm px-3 py-1 rounded-full bg-[#f3efe7] text-[#78716c]"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-serif font-semibold text-[#2c2c2c] mb-3 mt-8 pb-2 border-b border-[#e7e2d8]">
            联系我
          </h2>
          <p>
            如果你有任何想法或建议，欢迎通过以下方式联系我：
          </p>
          <div className="flex flex-wrap gap-4 mt-4">
            <a
              href="mailto:hello@example.com"
              className="text-[#b45309] hover:text-[#92400e] transition-colors underline underline-offset-2"
            >
              邮箱
            </a>
            <a
              href="#"
              className="text-[#b45309] hover:text-[#92400e] transition-colors underline underline-offset-2"
            >
              GitHub
            </a>
            <a
              href="#"
              className="text-[#b45309] hover:text-[#92400e] transition-colors underline underline-offset-2"
            >
              Twitter
            </a>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#e7e2d8]">
          <blockquote className="text-[#78716c] italic border-l-3 border-[#b45309] pl-4">
            "写作是为了更清楚地思考。"
          </blockquote>
        </div>
      </div>
    </div>
  );
}
