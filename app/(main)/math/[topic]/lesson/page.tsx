import fs from 'fs';
import path, { join } from 'path';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { LoadLesson } from '@/lib/loadLesson';
import Link from 'next/link';
import { FaPen } from 'react-icons/fa';

export const dynamic = 'error'; // disable ISR and SSR
export const revalidate = false; // disable ISR

const mdxComponents = {
  h1: (props: any) => (
    <h1
      className='mb-4 text-3xl font-bold text-secondary'
      {...props}
    />
  ),
  p: (props: any) => (
    <p
      className='mb-3 leading-relaxed text-foreground'
      {...props}
    />
  ),
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
      <article className='prose prose-slate max-w-none'>
        <h1 className='pb-3 text-3xl font-bold text-foreground'>{frontmatter.title}</h1>
        <div className='mb-14 text-lg text-muted-foreground'>
          {frontmatter.description}
        </div>
        {/* <div className='mt-8'>
          <span className='dark:text-gray-300'>Складність: </span>
          <div
            className={`mb-4 inline-block rounded-full px-3 py-1 text-sm font-semibold ${
              frontmatter.difficulty === 'easy'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : frontmatter.difficulty === 'medium'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}
          >
            {frontmatter.difficulty === 'easy'
              ? 'Легка'
              : frontmatter.difficulty === 'medium'
                ? 'Середня'
                : 'Складна'}
          </div>
        </div> */}
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
        className='mt-12 flex max-w-max items-center gap-2 rounded-lg border border-border bg-muted px-5 py-2 text-secondary no-underline shadow-sm transition-colors hover:bg-muted/80'
      >
        <FaPen />
        Перейти до вправ
      </Link>
    </div>
  );
}

const sideMenu = () => {};
