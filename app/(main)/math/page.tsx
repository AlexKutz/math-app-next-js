import { SubjectPage, SubjectPageData } from '@/components/SubjectPage';
import allTopics from '@/content/math/allTopics.json';

export default function MathPage() {
  const pageData: SubjectPageData = allTopics as SubjectPageData;

  return <SubjectPage data={pageData} basePath='/math' />;
}
