# Breadcrumb Navigation Implementation Plan

## 1. Create Breadcrumbs Component
Create a new server-side component [Breadcrumbs.tsx](file:///c:/Users/alex/Desktop/personal-site-next/math-app-next-js/components/Breadcrumbs.tsx) that displays a hierarchical path with Home icon and separators.

- Use `react-icons/ai` for `AiOutlineHome` and `react-icons/md` for `MdChevronRight`.
- Ensure dark mode compatibility using Tailwind utility classes.
- Support optional links for each breadcrumb item.

## 2. Integrate with Subject Overview Pages
Update [SubjectPage.tsx](file:///c:/Users/alex/Desktop/personal-site-next/math-app-next-js/components/SubjectPage.tsx) to display breadcrumbs at the top.
- Breadcrumbs: `Home > {Subject Title}`

## 3. Integrate with Lesson Pages
Update [LessonRenderer.tsx](file:///c:/Users/alex/Desktop/personal-site-next/math-app-next-js/components/lesson/LessonRenderer.tsx) to include breadcrumbs and remove the old absolute-positioned back button.
- Breadcrumbs: `Home > {Subject Label} > {Lesson Title} > Урок`
- Implement a mapping for subject slugs to Ukrainian labels:
  - math: "Математика"
  - algebra: "Алгебра"
  - geometry: "Геометрія"
  - physics: "Фізика"

## 4. Integrate with Exercise Pages
Update [app/(main)/math/[topic]/exercices/page.tsx](file:///c:/Users/alex/Desktop/personal-site-next/math-app-next-js/app/(main)/math/[topic]/exercices/page.tsx) to display breadcrumbs.
- Load lesson frontmatter to get the topic title.
- Breadcrumbs: `Home > Математика > {Lesson Title} > Урок > Вправи`
- "Урок" will link back to the lesson page.

## 5. Visual Refinement
- Ensure consistent spacing and styling across all pages.
- Verify dark mode appearance.
- Ensure the breadcrumbs are placed at the top of the content area (`max-w-4xl` container).
