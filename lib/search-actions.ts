'use server';

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { unstable_cache } from 'next/cache';

export type SearchItem = {
  title: string;
  description?: string;
  type: 'subject' | 'section' | 'lesson';
  href: string;
  subjectTitle: string;
};

// Cached version of getSearchData - data only changes at build time
// Using unstable_cache to persist across requests since data is immutable at runtime
const cachedGetSearchData = unstable_cache(
  async (): Promise<SearchItem[]> => {
    const contentDir = join(process.cwd(), 'content');
    const subjects = ['math', 'algebra', 'geometry', 'physics'];
    const items: SearchItem[] = [];

    for (const subject of subjects) {
      try {
        const allTopicsPath = join(contentDir, subject, 'allTopics.json');
        const fileContent = await readFile(allTopicsPath, 'utf-8');
        const data = JSON.parse(fileContent);

        const subjectTitle = data.pageTitle;

        // Add subject
        items.push({
          title: subjectTitle,
          description: data.pageDescription,
          type: 'subject',
          href: `/${subject}`,
          subjectTitle: subjectTitle,
        });

        // Add sections and lessons
        if (data.sections) {
          for (let i = 0; i < data.sections.length; i++) {
            const section = data.sections[i];
            items.push({
              title: section.title,
              description: section.description,
              type: 'section',
              href: `/${subject}#section-${i}`,
              subjectTitle: subjectTitle,
            });

            if (section.lessons) {
              for (const lesson of section.lessons) {
                items.push({
                  title: lesson.title,
                  type: 'lesson',
                  href: `/${subject}/${lesson.folder}/lesson`,
                  subjectTitle: subjectTitle,
                });
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error loading search data for ${subject}:`, error);
      }
    }

    return items;
  },
  ['search-data'],
  { revalidate: false } // Never revalidate - data only changes at build time
);

export async function getSearchData(): Promise<SearchItem[]> {
  return cachedGetSearchData();
}
