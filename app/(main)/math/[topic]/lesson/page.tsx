import fs from 'fs';
import path, { join } from 'path';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { LoadLesson } from '@/lib/loadLesson';
import Link from 'next/link';
import { FaPen } from "react-icons/fa";

export const dynamic = 'error'; // disable ISR and SSR
export const revalidate = false; // disable ISR

const mdxComponents = {
  h1: (props: any) => (
    <h1 className='mb-4 text-3xl font-bold text-blue-800' {...props} />
  ),
  p: (props: any) => <p className='mb-3 leading-relaxed' {...props} />,
};

export async function generateStaticParams() {
  const basePath = path.join(process.cwd(), 'content/math');
  const topics = fs.readdirSync(basePath, { withFileTypes: true });

  return topics
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({ topic: entry.name }));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;

  const lessonPath = join(process.cwd(), 'content/math', topic);

  const { content, frontmatter } = LoadLesson(lessonPath);

  const remarkPlugins: any[] = [];
  const rehypePlugins: any[] = [];

  if (frontmatter.math) {
    remarkPlugins.push(remarkMath);
    rehypePlugins.push(rehypeKatex);
  }

  return (
    <div>
      <article className='prose prose-slate'>
        <h1 className='pb-10 text-3xl font-bold'>{frontmatter.title}</h1>
        <div>
          <span>Складність: </span>
          <div
            className={`mb-4 inline-block rounded-full px-3 py-1 text-sm font-semibold ${frontmatter.difficulty === 'easy'
                ? 'bg-green-100 text-green-800'
                : frontmatter.difficulty === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
          >
            {frontmatter.difficulty === 'easy'
              ? 'Легка'
              : frontmatter.difficulty === 'medium'
                ? 'Середня'
                : 'Складна'}
          </div>
        </div>
        <div className='mb-12 bg-gray-100 p-4'>{frontmatter.description}</div>
        <MDXRemote
          source={content}
          components={mdxComponents}
          options={{
            scope: {},
            mdxOptions: {
              remarkPlugins: remarkPlugins,
              rehypePlugins: rehypePlugins,
            },
          }}
        />
      </article>
      <Link
        href={`/math/${topic}/exercices`}
        className='rounded-lg bg-gray-100 px-5 py-2 text-blue-600 no-underline flex max-w-max items-center gap-2 shadow-sm border border-gray-200'
      >
        <FaPen />Перейти до вправ
      </Link>
    </div>
  );
}

const sideMenu = () => {
  
}