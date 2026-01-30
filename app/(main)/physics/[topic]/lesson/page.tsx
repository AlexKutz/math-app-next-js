import fs from 'fs';
import path, { join } from 'path';
import { LoadLesson } from '@/lib/loadLesson';
import { LessonRenderer } from '@/components/lesson/LessonRenderer';

export const dynamic = 'error'; // disable ISR and SSR
export const revalidate = false; // disable ISR

export async function generateStaticParams() {
  const basePath = path.join(process.cwd(), 'content/physics');
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
  const lessonPath = join(process.cwd(), 'content/physics', topic);
  const { content, frontmatter } = LoadLesson(lessonPath);

  return (
    <LessonRenderer
      content={content}
      frontmatter={frontmatter}
      subject='physics'
      topic={topic}
    />
  );
}
