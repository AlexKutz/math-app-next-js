import { SubjectPage, SubjectPageData } from '@/components/SubjectPage';
import allTopics from '@/content/algebra/allTopics.json';

export default function AlgebraPage() {
  const pageData: SubjectPageData = allTopics as SubjectPageData;

  return <SubjectPage data={pageData} basePath='/algebra' />;
}
