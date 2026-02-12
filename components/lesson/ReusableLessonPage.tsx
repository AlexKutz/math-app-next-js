import fs from 'fs';
import path, { join } from 'path';
import { LoadLesson } from '@/lib/loadLesson';
import { LessonRenderer } from '@/components/lesson/LessonRenderer';

interface ReusableLessonPageProps {
  params: Promise<{ topic: string }>;
  subject: string;
}

export const dynamic = 'error'; // disable ISR and SSR
export const revalidate = false; // disable ISR

/**
 * Generates static parameters for a specific subject
 * @param subject - The subject name (math, algebra, geometry, physics)
 * @returns Array of topic parameters for static generation
 */
export async function generateStaticParamsForSubject(subject: string) {
  const basePath = path.join(process.cwd(), `content/${subject}`);
  const topics = fs.readdirSync(basePath, { withFileTypes: true });

  return topics
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({ topic: entry.name }));
}

/**
 * Reusable lesson page component that can be used across all subjects
 * Eliminates code duplication by parameterizing the subject
 */
export default async function ReusableLessonPage({
  params,
  subject,
}: ReusableLessonPageProps) {
  const { topic } = await params;
  const lessonPath = join(process.cwd(), `content/${subject}`, topic);
  const { content, frontmatter } = LoadLesson(lessonPath);

  return (
    <LessonRenderer
      content={content}
      frontmatter={frontmatter}
      subject={subject}
      topic={topic}
    />
  );
}