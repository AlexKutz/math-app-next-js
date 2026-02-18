import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ScrollToAnchor } from '@/components/system/ScrollToAnchor';
import { SubjectPageClient } from './SubjectPageClient';

type Lesson = {
  title: string;
  folder: string;
};

type TopicSection = {
  title: string;
  description?: string;
  lessons: Lesson[];
};

export type SubjectPageData = {
  pageTitle: string;
  pageDescription: string;
  sections: TopicSection[];
};

type SubjectPageProps = {
  data: SubjectPageData;
  basePath: string;
};

export function SubjectPage({ data, basePath }: SubjectPageProps) {
  return (
    <main className='space-y-8 rounded-lg'>
      <ScrollToAnchor />
      <Breadcrumbs items={[{ label: data.pageTitle }]} />
      <PageHeader title={data.pageTitle} description={data.pageDescription} />
      <SubjectPageClient data={data} basePath={basePath} />
    </main>
  );
}

function PageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className='space-y-2'>
      <h1 className='text-4xl font-bold tracking-tight text-foreground'>
        {title}
      </h1>
      <p className='text-lg text-muted-foreground'>{description}</p>
    </div>
  );
}
