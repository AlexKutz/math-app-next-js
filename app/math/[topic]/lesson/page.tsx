import fs from 'fs'
import path, { join } from 'path'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { LoadLesson } from '@/lib/loadLesson'
import Link from 'next/link'

export const dynamic = 'error' // disable ISR and SSR
export const revalidate = false // disable ISR

const mdxComponents = {
  h1: (props: any) => <h1 className="text-3xl font-bold mb-4 text-blue-800" {...props} />,
  p: (props: any) => <p className="mb-3 leading-relaxed" {...props} />,
}

export async function generateStaticParams() {
  const basePath = path.join(process.cwd(), 'content/math')
  const topics = fs.readdirSync(basePath, { withFileTypes: true })

  return topics
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({ topic: entry.name }))
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ topic: string }>
}) {
  const { topic } = await params

  const lessonPath = join(process.cwd(), 'content/math', topic)

  const { content, frontmatter } = LoadLesson(lessonPath)

  const remarkPlugins: any[] = []
  const rehypePlugins: any[] = []

  if (frontmatter.math) {
    remarkPlugins.push(remarkMath)
    rehypePlugins.push(rehypeKatex)
  }

  return (
    <div>
      <article className="prose prose-slate max-w-none">
        <h1>{frontmatter.title}</h1>
        <h2>{frontmatter.description}</h2>
        <Link href={`/math/${topic}/exercices`} className="text-blue-600 underline">
          {' '}
          Go to Exercises
        </Link>
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
    </div>
  )
}
