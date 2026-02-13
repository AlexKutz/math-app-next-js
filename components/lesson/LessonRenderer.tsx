import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import Link from 'next/link';
import type { LessonFrontmatter } from '@/types/lesson';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PiPencilRuler } from "react-icons/pi";
import { TableOfContents } from './TableOfContents';

const SUBJECT_LABELS: Record<string, string> = {
  math: 'Математика',
  algebra: 'Алгебра',
  geometry: 'Геометрія',
  physics: 'Фізика',
};

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface LessonRendererProps {
  content: string;
  frontmatter: LessonFrontmatter;
  subject: string;
  topic: string;
}

function generateId(text: string): string {
  // Ukrainian Cyrillic to Latin transliteration map
  const cyrillicToLatin: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ye',
    'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l',
    'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'H', 'Ґ': 'G', 'Д': 'D', 'Е': 'E', 'Є': 'Ye',
    'Ж': 'Zh', 'З': 'Z', 'И': 'Y', 'І': 'I', 'Ї': 'Yi', 'Й': 'Y', 'К': 'K', 'Л': 'L',
    'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
    'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch', 'Ь': '', 'Ю': 'Yu', 'Я': 'Ya'
  };

  // Transliterate Cyrillic characters to Latin
  let transliterated = text.replace(/[А-Яа-яЁё]/g, (char) => cyrillicToLatin[char] || char);
  
  // Convert to lowercase and clean up
  return transliterated
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')  // Keep only Latin letters, numbers, spaces, and hyphens
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/-+/g, '-')            // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '')          // Remove leading/trailing hyphens
    .substring(0, 50) || `heading-${Math.random().toString(36).substr(2, 9)}`;  // Fallback for empty strings
}

function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const match = line.match(/^(#{2,4})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = generateId(text);
      headings.push({ id, text, level });
    }
  }
  
  return headings;
}



function createHeadingComponents(headings: Heading[]) {
  const headingMap = new Map(headings.map(h => [h.text, h.id]));
  
  return {
    h1: (props: any) => (
      <h1
        className='mb-6 mt-8 text-4xl font-bold text-secondary border-b border-border pb-3'
        {...props}
      />
    ),
    h2: (props: any) => {
      const id = headingMap.get(props.children) || generateId(props.children);
      return (
        <h2
          id={id}
          className='mb-4 mt-8 text-3xl font-semibold text-secondary scroll-mt-24'
          {...props}
        />
      );
    },
    h3: (props: any) => {
      const id = headingMap.get(props.children) || generateId(props.children);
      return (
        <h3
          id={id}
          className='mb-3 mt-6 text-2xl font-semibold text-foreground scroll-mt-24'
          {...props}
        />
      );
    },
    h4: (props: any) => {
      const id = headingMap.get(props.children) || generateId(props.children);
      return (
        <h4
          id={id}
          className='mb-2 mt-4 text-xl font-medium text-foreground scroll-mt-24'
          {...props}
        />
      );
    },
  };
}

const mdxComponents = {
  h1: (props: any) => (
    <h1
      className='mb-6 mt-8 text-4xl font-bold text-secondary border-b border-border pb-3'
      {...props}
    />
  ),
  h2: (props: any) => (
    <h2
      className='mb-4 mt-8 text-3xl font-semibold text-secondary scroll-mt-24'
      {...props}
    />
  ),
  h3: (props: any) => (
    <h3
      className='mb-3 mt-6 text-2xl font-semibold text-foreground scroll-mt-24'
      {...props}
    />
  ),
  h4: (props: any) => (
    <h4
      className='mb-2 mt-4 text-xl font-medium text-foreground scroll-mt-24'
      {...props}
    />
  ),
  p: (props: any) => (
    <p
      className='mb-4 leading-relaxed text-foreground text-lg'
      {...props}
    />
  ),
  ul: (props: any) => (
    <ul
      className='mb-4 ml-6 list-disc space-y-2 text-foreground'
      {...props}
    />
  ),
  ol: (props: any) => (
    <ol
      className='mb-4 ml-6 list-decimal space-y-2 text-foreground'
      {...props}
    />
  ),
  li: (props: any) => (
    <li
      className='leading-relaxed text-lg'
      {...props}
    />
  ),
  blockquote: (props: any) => (
    <blockquote
      className='my-4 border-l-4 border-secondary bg-muted/50 py-2 px-4 italic text-muted-foreground'
      {...props}
    />
  ),
  code: (props: any) => (
    <code
      className='rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-accent'
      {...props}
    />
  ),
  pre: (props: any) => (
    <pre
      className='mb-4 overflow-x-auto rounded-lg bg-muted p-4 text-sm'
      {...props}
    />
  ),
  strong: (props: any) => (
    <strong
      className='font-semibold text-secondary'
      {...props}
    />
  ),
  em: (props: any) => (
    <em
      className='italic text-muted-foreground'
      {...props}
    />
  ),
};

const isTableOfContentsRendered = true;
const debugBorders = false;

export function LessonRenderer({
  content,
  frontmatter,
  subject,
  topic,
}: LessonRendererProps) {
  const remarkPlugins: any[] = [];
  const rehypePlugins: any[] = [];

  if (frontmatter.math) {
    remarkPlugins.push(remarkMath);
    rehypePlugins.push(rehypeKatex);
  }

  const headings = extractHeadings(content);
  const headingComponents = createHeadingComponents(headings);
  const dynamicComponents = { ...mdxComponents, ...headingComponents };

  const breadcrumbItems = [
    { label: SUBJECT_LABELS[subject] || subject, href: `/${subject}` },
    { label: frontmatter.title || 'Урок' },
  ];

  return (
    <>
    {isTableOfContentsRendered && <TableOfContents headings={headings} />}
    <div className={`mx-auto max-w-4xl ${isTableOfContentsRendered ? 'lg:max-w-[70vw]' : ''} relative pb-12 ${isTableOfContentsRendered ? 'lg:-translate-x-[calc((98vw-1536px)/4.2)]' : ''}  2xl:translate-x-0 ${debugBorders ? 'border border-amber-400' : ''}`}>
      <Breadcrumbs items={breadcrumbItems} />
      <article className='prose prose-slate prose-lg max-w-none dark:prose-invert'>
        <div className='mb-8 border-b border-border pb-6'>
          <h1 className='mb-3 text-4xl font-bold text-foreground'>
            {frontmatter.title}
          </h1>
          {frontmatter.description && (
            <div className='text-xl text-muted-foreground'>
              {frontmatter.description}
            </div>
          )}
        </div>
        
        <div className='lesson-content'>
          <MDXRemote
            source={content}
            components={dynamicComponents}
            options={{
              scope: {},
              mdxOptions: {
                remarkPlugins: remarkPlugins,
                rehypePlugins: rehypePlugins,
              },
            }}
          />
        </div>
      </article>
      <div className='mt-12 flex border-t border-border pt-10 select-none'>
        <Link
          href={`/${subject}/${topic}/exercises`}
          className='h-16 group antialiased transform-gpu inline-flex items-center gap-3 rounded-xl bg-primary w-56 px-5 py-2 font-bold text-primary-foreground no-underline shadow-lg transition-all duration-300 hover:bg-primary/90 hover:shadow-xl active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
        >
          <PiPencilRuler className='h-7 w-7 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-105' />
          Вправи
        </Link>
      </div>
    </div>
    </>
    
  );
}
