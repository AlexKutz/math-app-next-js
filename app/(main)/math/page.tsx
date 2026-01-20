import Link from 'next/link';
import { ReactNode } from 'react';

export default function Math() {
  return (
    <section className='space-y-6'>
      <h1 className='pl-6 text-3xl font-semibold'>Математика</h1>
      <MathTopicsList />
    </section>
  );
}

function MathTopicsList() {
  return (
    <ol className='list-decimal space-y-6 pl-10'>
      <Section title='Дроби'>
        <TopicItem
          title='Додавання дробів'
          href='/math/fractions/lesson'
          status='Не почато'
        />
      </Section>
    </ol>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className='space-y-4'>
      <div className='flex max-w-32 items-center justify-between p-1'>
        <h2 className='text-xl font-medium'>{title}</h2>
        <div className='rounded-full bg-amber-300 p-2 opacity-85 dark:bg-amber-700'>
          0/1
        </div>
      </div>
      <ol className='flex list-decimal space-y-3 pl-6'>{children}</ol>
    </li>
  );
}

type TopicItemProps = {
  title: string;
  href: string;
  status?: 'Не почато' | 'В процесі' | 'Завершено';
};

function TopicItem({ title, href, status }: TopicItemProps) {
  return (
    <li className='min-w-96'>
      <Link
        href={href}
        className='flex items-center justify-between rounded-2xl bg-amber-100 p-4 transition hover:bg-amber-200 focus:ring-2 focus:ring-amber-400 focus:outline-none dark:bg-[#7a7a4533] dark:hover:bg-[#7a7a4566] dark:focus:ring-amber-600'
      >
        <span className='font-medium'>{title}</span>

        {status && (
          <span className='rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700'>
            {status}
          </span>
        )}
      </Link>
    </li>
  );
}
