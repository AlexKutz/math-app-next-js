import { join } from 'path'
import { readFileSync } from 'fs'
import matter from 'gray-matter'
import { LessonFrontmatter } from '@/types/lesson'

export function LoadLesson(lessonPath: string) {
  const mdxPath = join(lessonPath, 'index.mdx')

  const raw = readFileSync(mdxPath, 'utf-8')

  const { content, data } = matter(raw)

  const frontmatter = data as LessonFrontmatter

  return { content, frontmatter }
}
