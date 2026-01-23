import { SubjectPage, SubjectPageData } from '@/components/SubjectPage';
import allTopics from '@/content/physics/allTopics.json';

export default function PhysicsPage() {
  const pageData: SubjectPageData = allTopics as SubjectPageData;

  return <SubjectPage data={pageData} basePath='/physics' />;
}
