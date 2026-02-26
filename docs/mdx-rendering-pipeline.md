# MDX Rendering Pipeline Technical Documentation

## Overview

This document provides a comprehensive technical explanation of how MDX files are processed and rendered in this Next.js educational platform. The system handles Ukrainian-language mathematical content with advanced features like LaTeX formula rendering, custom component mapping, and responsive image handling.

## Architecture Flow

```
MDX File → LoadLesson → Frontmatter Parsing → MDX Transformation → Component Mapping → Browser Rendering
```

## 1. MDX File Loading and Processing

### The LoadLesson Function

Located in `lib/loadLesson.ts`, this is the entry point for MDX processing:

```typescript
import { join } from 'path';
import { readFileSync } from 'fs';
import matter from 'gray-matter';
import { LessonFrontmatter } from '@/types/lesson';

export function LoadLesson(lessonPath: string) {
  const mdxPath = join(lessonPath, 'index.mdx');
  const raw = readFileSync(mdxPath, 'utf-8');
  const { content, data } = matter(raw);
  const frontmatter = data as LessonFrontmatter;
  return { content, frontmatter };
}
```

**Key Technical Details:**

- **Synchronous File Reading**: Uses Node.js `fs.readFileSync` for build-time processing
- **Path Resolution**: Constructs file paths using `path.join()` for cross-platform compatibility
- **UTF-8 Encoding**: Ensures proper handling of Ukrainian Cyrillic characters
- **Return Structure**: Separates content (MDX body) from metadata (frontmatter)

### Integration Point

Called from `ReusableLessonPage.tsx` during static generation:

```typescript
export default async function ReusableLessonPage({ params, subject }: ReusableLessonPageProps) {
  const { topic } = await params
  const lessonPath = join(process.cwd(), `content/${subject}`, topic)
  const { content, frontmatter } = LoadLesson(lessonPath)

  return (
    <LessonRenderer
      content={content}
      frontmatter={frontmatter}
      subject={subject}
      topic={topic}
    />
  )
}
```

## 2. Frontmatter Data Processing

### Type Definition

Defined in `types/lesson.ts`:

```typescript
export type LessonFrontmatter = {
  title?: string;
  description?: string;
  difficulty?: string;
  math?: boolean;
};
```

### YAML Structure Example

```mdx
---
title: 'Позиційна система числення'
description: 'Класи та розряди натуральних чисел'
difficulty: 'easy'
math: true
---
```

### Gray-Matter Parsing

The `gray-matter` library processes the frontmatter block:

- Extracts YAML metadata from between `---` delimiters
- Parses into JavaScript objects with proper type casting
- Makes metadata available as structured data for component rendering

## 3. MDX Content Transformation with next-mdx-remote

### Server Components Integration

Using React Server Components in `LessonRenderer.tsx`:

```typescript
import { MDXRemote } from 'next-mdx-remote/rsc'

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
```

### Plugin Architecture

**Remark Plugins** (Markdown processing):

- `remark-math`: Parses LaTeX mathematical syntax
- Custom remark plugins can be added for additional preprocessing

**Rehype Plugins** (HTML processing):

- `rehype-katex`: Renders mathematical expressions using KaTeX
- Custom rehype plugins for post-processing HTML output

### Next.js App Router Integration

```typescript
export const dynamic = 'error'; // disable ISR and SSR
export const revalidate = false; // disable ISR
```

This configuration ensures:

- Pure static site generation
- No server-side rendering at runtime
- Optimal performance through pre-rendered pages
- Compatibility with React Server Components

## 4. Component Mapping Process

### Static Component Definitions

The `mdxComponents` object maps HTML elements to styled React components:

```typescript
const mdxComponents = {
  h1: (props: any) => (
    <h1 className='mb-6 mt-8 text-4xl font-bold text-secondary border-b border-border pb-3' {...props} />
  ),
  p: (props: any) => (
    <p className='mb-4 leading-relaxed text-foreground text-lg' {...props} />
  ),
  ul: (props: any) => (
    <ul className='mb-4 ml-6 list-disc space-y-2 text-foreground' {...props} />
  ),
  // ... comprehensive component mapping
}
```

### Dynamic Heading Components

Special handling for headings with automatic ID generation:

```typescript
function createHeadingComponents(headings: Heading[]) {
  const headingMap = new Map(headings.map(h => [h.text, h.id]))

  return {
    h2: (props: any) => {
      const id = headingMap.get(props.children) || generateId(props.children)
      return (
        <h2
          id={id}
          className='mb-4 mt-8 text-3xl font-semibold text-secondary scroll-mt-24'
          {...props}
        />
      )
    },
    // h3 and h4 similarly implemented
  }
}
```

### Component Composition Strategy

```typescript
const headings = extractHeadings(content);
const headingComponents = createHeadingComponents(headings);
const dynamicComponents = { ...mdxComponents, ...headingComponents };
```

This approach:

- Provides base styling for all elements
- Overrides specific headings with ID-aware versions
- Maintains clean separation of concerns

## 5. Mathematical Formula Handling

### Conditional Plugin Activation

```typescript
const remarkPlugins: any[] = [];
const rehypePlugins: any[] = [];

if (frontmatter.math) {
  remarkPlugins.push(remarkMath);
  rehypePlugins.push(rehypeKatex);
}
```

### LaTeX Syntax Support

**Inline Formulas:**

```mdx
Формула площі кола: $S = \pi r^2$
```

**Block Formulas:**

```mdx
$$
E = mc^2
$$
```

### Processing Pipeline

1. **Remark Stage**: `remark-math` identifies LaTeX syntax patterns
2. **Rehype Stage**: `rehype-katex` converts LaTeX to HTML/CSS using KaTeX
3. **Runtime**: Browser renders mathematical expressions with proper typography

## 6. Heading Extraction and Table of Contents Generation

### Heading Parser Implementation

```typescript
interface Heading {
  id: string;
  text: string;
  level: number;
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
```

### Table of Contents Integration

The extracted headings feed into the `TableOfContents` component:

```typescript
{isTableOfContentsRendered && <TableOfContents headings={headings} />}
```

This creates:

- Interactive navigation sidebar
- Smooth scrolling to section anchors
- Hierarchical structure visualization

## 7. Custom Image Component Implementation

### Enhanced Image Handling

```typescript
Image: (props: any) => {
  const {
    align = 'center',
    wrap,
    width,
    height,
    shadow = true,
    src,
    alt = '',
    ...rest
  } = props

  // Parse numeric dimensions - handle string inputs from MDX
  const parseNum = (val: any): number | undefined => {
    if (val === undefined || val === null || val === '') return undefined
    const num = typeof val === 'number' ? val : parseInt(String(val), 10)
    return isNaN(num) ? undefined : num
  }

  const numWidth = parseNum(width)
  const numHeight = parseNum(height)
  const hasExplicitDimensions = numWidth !== undefined && numHeight !== undefined

  // Shadow class - disabled for transparent images
  const shadowClass = shadow === 'false' || shadow === false ? '' : 'shadow-md'

  // Alignment classes
  const getAlignClasses = () => {
    if (wrap === 'true' || wrap === true) {
      switch (align) {
        case 'left': return 'float-left mr-6 mb-4'
        case 'right': return 'float-right ml-6 mb-4'
        default: return 'mx-auto block'
      }
    } else {
      switch (align) {
        case 'left': return 'mr-auto block'
        case 'right': return 'ml-auto block'
        default: return 'mx-auto block'
      }
    }
  }

  const alignClass = getAlignClasses()

  return (
    <NextImage
      src={src}
      alt={alt}
      width={numWidth || 800}
      height={numHeight || 600}
      className={`my-6 rounded-lg ${shadowClass} ${alignClass}`}
      style={hasExplicitDimensions ? { width: numWidth, maxWidth: '100%', height: 'auto' } : undefined}
      {...rest}
    />
  )
}
```

### Key Features

- **Dimension Parsing**: Handles both numeric and string width/height values
- **Responsive Design**: Automatic scaling with `maxWidth: '100%'`
- **Text Wrapping**: CSS float-based layout when `wrap="true"`
- **Shadow Control**: Toggleable drop shadows for different image types
- **Alignment Options**: Left, center, and right positioning
- **Next.js Optimization**: Leverages built-in image optimization features

## 8. Breadcrumb Generation and Layout Structure

### Navigation Context

```typescript
const SUBJECT_LABELS: Record<string, string> = {
  math: 'Математика',
  algebra: 'Алгебра',
  geometry: 'Геометрія',
  physics: 'Фізика',
}

const breadcrumbItems = [
  { label: SUBJECT_LABELS[subject] || subject, href: `/${subject}` },
  { label: frontmatter.title || 'Урок' },
]

<Breadcrumbs items={breadcrumbItems} />
```

### Layout Composition

```typescript
<div className={`mx-auto max-w-4xl relative pb-12 ${isTableOfContentsRendered ? 'lg:-translate-x-[calc((98vw-1536px)/4.2)]' : ''} 2xl:translate-x-0`}>
  <article className='prose prose-slate prose-lg max-w-none dark:prose-invert'>
    {/* Content rendering */}
  </article>
</div>
```

**Layout Features:**

- Responsive max-width container
- Dynamic positioning based on TOC visibility
- Proper spacing and padding
- Dark mode support through `prose-invert`

## 9. Ukrainian Cyrillic Text Handling

### ID Generation with Transliteration

```typescript
function generateId(text: string): string {
  // Ukrainian Cyrillic to Latin transliteration map
  const cyrillicToLatin: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'h',
    ґ: 'g',
    д: 'd',
    е: 'e',
    є: 'ye',
    ж: 'zh',
    з: 'z',
    и: 'y',
    і: 'i',
    ї: 'yi',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'kh',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'shch',
    ь: '',
    ю: 'yu',
    я: 'ya',
    // Capital letters similarly mapped
  };

  // Transliterate Cyrillic characters to Latin
  let transliterated = text.replace(
    /[А-Яа-яЁё]/g,
    (char) => cyrillicToLatin[char] || char,
  );

  // Convert to lowercase and clean up
  return (
    transliterated
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Keep only Latin letters, numbers, spaces, and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 50) || `heading-${Math.random().toString(36).substr(2, 9)}`
  ); // Fallback for empty strings
}
```

### Unicode Support Features

- Complete Ukrainian alphabet coverage
- Proper handling of special characters (ї, є, ґ, и)
- Case-sensitive transliteration
- Length limiting to prevent overly long IDs
- Random fallback for edge cases

## 10. CSS Styling Application

### Prose Typography System

```jsx
<article className='prose prose-slate prose-lg max-w-none dark:prose-invert'>
```

Utilizes Tailwind CSS Typography plugin for:

- Consistent markdown styling
- Responsive typography scaling
- Dark mode adaptation
- Semantic HTML element styling

### Component-Specific Styling

**Typography Classes:**

- `text-lg`, `text-xl`, `text-2xl` - Font sizing
- `leading-relaxed` - Line height
- `font-semibold`, `font-bold` - Font weights

**Spacing Classes:**

- `mb-4`, `mt-8` - Margin utilities
- `py-2`, `px-4` - Padding utilities
- `space-y-2` - List item spacing

**Color System:**

- `text-foreground` - Primary text color
- `text-secondary` - Secondary text/emphasis
- `text-muted-foreground` - Subtle text
- `bg-muted` - Background utilities

**Layout Utilities:**

- `mx-auto` - Center alignment
- `block`, `inline-block` - Display properties
- `float-left`, `float-right` - Text wrapping

### Responsive Design Implementation

```css
/* Desktop positioning with table of contents */
lg:-translate-x-[calc((98vw-1536px)/4.2)]

/* Reset positioning on larger screens */
2xl:translate-x-0
```

This creates adaptive layouts that:

- Adjust content positioning based on screen width
- Maintain proper spacing with sidebar elements
- Scale appropriately across device sizes

## Complete Integration Flow

### 1. Build-Time Processing

```
Next.js Build → generateStaticParams → File System Scanning → Path Resolution
```

### 2. Content Loading

```
ReusableLessonPage → LoadLesson → File Reading → Frontmatter Parsing
```

### 3. MDX Transformation

```
MDXRemote → Remark Plugins → Rehype Plugins → Component Mapping
```

### 4. Runtime Rendering

```
Server Components → Client Hydration → Interactive Elements → Browser Display
```

## Performance Optimizations

### Static Site Generation Benefits

- Pre-rendered HTML at build time
- No server-side computation per request
- CDN-friendly static assets
- Instant page loading

### Component-Level Optimizations

- Server Components reduce client bundle size
- Automatic code splitting for MDX content
- Lazy loading of non-critical components
- Optimized image loading through Next.js Image

### Caching Strategies

- Static asset caching through Vercel/CDN
- Browser-level caching of generated pages
- Efficient revalidation strategies

## Error Handling and Resilience

### Graceful Degradation

- Fallback content for missing frontmatter
- Default styling for unrecognized components
- Error boundaries for component failures

### Validation Layers

- TypeScript type checking for frontmatter
- Runtime validation of required props
- Safe parsing of numeric values

This comprehensive MDX rendering pipeline enables rich, interactive educational content while maintaining excellent performance and developer experience through modern Next.js features and careful architectural decisions.
