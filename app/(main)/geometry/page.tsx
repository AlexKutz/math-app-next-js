import { SubjectPage, SubjectPageData } from '@/components/SubjectPage';
import allTopics from '@/content/geometry/allTopics.json';

export default function GeometryPage() {
  const pageData: SubjectPageData = allTopics as SubjectPageData;

  return <SubjectPage data={pageData} basePath='/geometry' />;
}
