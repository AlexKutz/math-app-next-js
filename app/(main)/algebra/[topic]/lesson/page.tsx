import ReusableLessonPage, { generateStaticParamsForSubject } from '@/components/lesson/ReusableLessonPage';

export const dynamic = 'error'; // disable ISR and SSR
export const revalidate = false; // disable ISR

export async function generateStaticParams() {
  return generateStaticParamsForSubject('algebra');
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  return ReusableLessonPage({ params, subject: 'algebra' });
}
