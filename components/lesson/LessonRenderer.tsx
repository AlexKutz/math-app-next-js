import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import Link from 'next/link';
import { FaPen } from 'react-icons/fa';
import type { LessonFrontmatter } from '@/types/lesson';

interface LessonRendererProps {
  content: string;
  frontmatter: LessonFrontmatter;
  subject: string;
  topic: string;
}

const mdxComponents = {
  h1: (props: any) => (
    <h1
      className='mb-6 mt-8 text-4xl font-bold text-secondary border-b border-border pb-3'
      {...props}
    />
  ),
  h2: (props: any) => (
    <h2
      className='mb-4 mt-8 text-3xl font-semibold text-secondary'
      {...props}
    />
  ),
  h3: (props: any) => (
    <h3
      className='mb-3 mt-6 text-2xl font-semibold text-foreground'
      {...props}
    />
  ),
  h4: (props: any) => (
    <h4
      className='mb-2 mt-4 text-xl font-medium text-foreground'
      {...props}
    />
  ),
  p: (props: any) => (
    <p
      className='mb-4 leading-relaxed text-foreground text-lg'
      {...props}
    />
  ),
  ul: (props: any) => (
    <ul
      className='mb-4 ml-6 list-disc space-y-2 text-foreground'
      {...props}
    />
  ),
  ol: (props: any) => (
    <ol
      className='mb-4 ml-6 list-decimal space-y-2 text-foreground'
      {...props}
    />
  ),
  li: (props: any) => (
    <li
      className='leading-relaxed text-lg'
      {...props}
    />
  ),
  blockquote: (props: any) => (
    <blockquote
      className='my-4 border-l-4 border-secondary bg-muted/50 py-2 px-4 italic text-muted-foreground'
      {...props}
    />
  ),
  code: (props: any) => (
    <code
      className='rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-accent'
      {...props}
    />
  ),
  pre: (props: any) => (
    <pre
      className='mb-4 overflow-x-auto rounded-lg bg-muted p-4 text-sm'
      {...props}
    />
  ),
  strong: (props: any) => (
    <strong
      className='font-semibold text-secondary'
      {...props}
    />
  ),
  em: (props: any) => (
    <em
      className='italic text-muted-foreground'
      {...props}
    />
  ),
};

export function LessonRenderer({
  content,
  frontmatter,
  subject,
  topic,
}: LessonRendererProps) {
  const remarkPlugins: any[] = [];
  const rehypePlugins: any[] = [];

  if (frontmatter.math) {
    remarkPlugins.push(remarkMath);
    rehypePlugins.push(rehypeKatex);
  }

  return (
    <div className='mx-auto max-w-4xl'>
      <article className='prose prose-slate prose-lg max-w-none dark:prose-invert'>
        <div className='mb-8 border-b border-border pb-6'>
          <h1 className='mb-3 text-4xl font-bold text-foreground'>
            {frontmatter.title}
          </h1>
          {frontmatter.description && (
            <div className='text-xl text-muted-foreground'>
              {frontmatter.description}
            </div>
          )}
          {frontmatter.difficulty && (
            <div className='mt-4'>
              <span
                className={`inline-block rounded-full px-4 py-1.5 text-sm font-semibold ${
                  frontmatter.difficulty === 'easy'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : frontmatter.difficulty === 'medium'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}
              >
                {frontmatter.difficulty === 'easy'
                  ? 'Легка'
                  : frontmatter.difficulty === 'medium'
                    ? 'Середня'
                    : 'Складна'}
              </span>
            </div>
          )}
        </div>
        <div className='lesson-content'>
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
        </div>
      </article>
      <div className='mt-12 border-t border-border pt-8'>
        <Link
          href={`/${subject}/${topic}/exercices`}
          className='inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-6 py-3 text-lg font-medium text-secondary-foreground no-underline shadow-sm transition-all hover:bg-secondary/90 hover:shadow-md'
        >
          <FaPen />
          Перейти до вправ
        </Link>
      </div>
    </div>
  );
}
