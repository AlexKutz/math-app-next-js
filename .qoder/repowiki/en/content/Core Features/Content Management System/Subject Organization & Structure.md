# Subject Organization & Structure

<cite>
**Referenced Files in This Document**
- [content/algebra/allTopics.json](file://content/algebra/allTopics.json)
- [content/geometry/allTopics.json](file://content/geometry/allTopics.json)
- [content/physics/allTopics.json](file://content/physics/allTopics.json)
- [content/math/allTopics.json](file://content/math/allTopics.json)
- [content/math/addition_and_subtraction_of_fractions/config.json](file://content/math/addition_and_subtraction_of_fractions/config.json)
- [content/math/natural_numbers/index.mdx](file://content/math/natural_numbers/index.mdx)
- [content/math/addition_and_subtraction_of_fractions/index.mdx](file://content/math/addition_and_subtraction_of_fractions/index.mdx)
- [app/(main)/algebra/page.tsx](file://app/(main)/algebra/page.tsx)
- [app/(main)/geometry/page.tsx](file://app/(main)/geometry/page.tsx)
- [app/(main)/physics/page.tsx](file://app/(main)/physics/page.tsx)
- [app/(main)/math/page.tsx](file://app/(main)/math/page.tsx)
- [app/(main)/math/[topic]/lesson/page.tsx](file://app/(main)/math/[topic]/lesson/page.tsx)
- [app/(main)/math/[topic]/exercices/page.tsx](file://app/(main)/math/[topic]/exercices/page.tsx)
- [components/SubjectPage.tsx](file://components/SubjectPage.tsx)
- [lib/loadLesson.ts](file://lib/loadLesson.ts)
- [lib/loadTasks.ts](file://lib/loadTasks.ts)
- [types/topic-config.ts](file://types/topic-config.ts)
- [types/lesson.ts](file://types/lesson.ts)
</cite>

## Update Summary
**Changes Made**
- Updated subject navigation architecture to reflect the complete refactoring from monolithic math page to individual subject pages
- Added documentation for the new unified SubjectPage component pattern
- Updated navigation patterns to show subject-specific routes (/algebra, /geometry, /physics)
- Enhanced section coverage of the new subject organization system

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document explains the subject organization system used to structure mathematical content across disciplines. The system has been completely refactored to use individual subject pages (Algebra, Geometry, Physics) with a unified SubjectPage component, replacing the previous monolithic math page approach. It covers how subjects are organized hierarchically with sections, subsections, and lessons, documenting the JSON configuration structure, lesson content model, and enhanced navigation patterns that ensure consistency across all subjects.

## Project Structure
The system now organizes content by subject under dedicated Next.js pages, with each subject having its own page component that uses a shared SubjectPage component for rendering.

- Individual subject pages are rendered by dedicated Next.js pages under `/algebra`, `/geometry`, and `/physics` routes.
- Each subject page imports a JSON catalog and passes it to the unified SubjectPage component with a subject-specific basePath.
- Lessons are stored as MDX files with frontmatter and optional task sets.
- Exercises are served via a separate route that loads task JSON files located alongside lessons.

```mermaid
graph TB
subgraph "Individual Subject Pages"
A["/algebra<br/>AlgebraPage"]
G["/geometry<br/>GeometryPage"]
P["/physics<br/>PhysicsPage"]
M["/math<br/>MathPage (legacy)"]
end
subgraph "Shared Component"
SP["SubjectPage Component"]
end
subgraph "Content Catalogs"
CAT_A["content/algebra/allTopics.json"]
CAT_G["content/geometry/allTopics.json"]
CAT_P["content/physics/allTopics.json"]
CAT_M["content/math/allTopics.json"]
end
subgraph "Topic Content"
TOP_FRACTIONS["content/math/addition_and_subtraction_of_fractions/"]
TOP_NATNUM["content/math/natural_numbers/"]
end
A --> SP
G --> SP
P --> SP
M --> SP
SP --> CAT_A
SP --> CAT_G
SP --> CAT_P
SP --> CAT_M
CAT_M --> TOP_FRACTIONS
CAT_M --> TOP_NATNUM
```

**Diagram sources**
- [app/(main)/algebra/page.tsx](file://app/(main)/algebra/page.tsx#L1-L9)
- [app/(main)/geometry/page.tsx](file://app/(main)/geometry/page.tsx#L1-L9)
- [app/(main)/physics/page.tsx](file://app/(main)/physics/page.tsx#L1-L9)
- [components/SubjectPage.tsx](file://components/SubjectPage.tsx#L26-L33)

**Section sources**
- [app/(main)/algebra/page.tsx](file://app/(main)/algebra/page.tsx#L1-L9)
- [app/(main)/geometry/page.tsx](file://app/(main)/geometry/page.tsx#L1-L9)
- [app/(main)/physics/page.tsx](file://app/(main)/physics/page.tsx#L1-L9)
- [components/SubjectPage.tsx](file://components/SubjectPage.tsx#L26-L33)

## Core Components
The subject organization system now comprises four primary layers:
- **Unified SubjectPage component**: A shared component that renders subject catalogs consistently across all subjects.
- **Subject page components**: Individual Next.js pages for each subject that import JSON catalogs and pass them to the SubjectPage component.
- **Subject catalog JSON**: JSON files that define subject metadata and hierarchical sections with lessons.
- **Lesson content**: MDX files with frontmatter for title, description, difficulty, and math rendering flags.
- **Exercise system**: Separate pages that load task sets from JSON files located alongside lessons.

Key data structures:
- **SubjectPageData**: Defines the subject-level metadata and sections array for the unified component.
- **TopicSection**: Defines a section with title, optional description, and a lessons array.
- **Lesson**: Defines a lesson with title and folder reference.
- **TopicConfig**: Defines topic-level configuration used for advanced features (XP, scheduling).
- **LessonFrontmatter**: Defines lesson frontmatter fields for rendering.

**Section sources**
- [components/SubjectPage.tsx](file://components/SubjectPage.tsx#L15-L19)
- [types/topic-config.ts](file://types/topic-config.ts#L3-L16)
- [types/lesson.ts](file://types/lesson.ts#L1-L6)

## Architecture Overview
The system follows a content-first architecture with a unified rendering component:
- Individual subject pages import a JSON catalog and pass it to the shared SubjectPage component with a subject-specific basePath.
- The SubjectPage component renders sections and lessons consistently across all subjects using the basePath for navigation.
- Lesson pages load MDX content dynamically and optionally enable math rendering.
- Exercise pages load task sets from JSON files located alongside lessons.

```mermaid
sequenceDiagram
participant User as "User"
participant AlgebraPage as "Algebra Page (/algebra)"
participant GeometryPage as "Geometry Page (/geometry)"
participant PhysicsPage as "Physics Page (/physics)"
participant SubjectComp as "SubjectPage Component"
participant LessonPage as "Lesson Page (/math/ : topic/lesson)"
participant ExercicesPage as "Exercises Page (/math/ : topic/exercices)"
User->>AlgebraPage : Navigate to /algebra
AlgebraPage->>SubjectComp : Render with SubjectPageData and basePath='/algebra'
SubjectComp->>SubjectComp : Render sections and lessons with subject-specific links
User->>GeometryPage : Navigate to /geometry
GeometryPage->>SubjectComp : Render with SubjectPageData and basePath='/geometry'
SubjectComp->>SubjectComp : Render sections and lessons with subject-specific links
User->>PhysicsPage : Navigate to /physics
PhysicsPage->>SubjectComp : Render with SubjectPageData and basePath='/physics'
SubjectComp->>SubjectComp : Render sections and lessons with subject-specific links
User->>LessonPage : Click lesson card
LessonPage->>LessonPage : Load MDX content and frontmatter
LessonPage-->>User : Display lesson with optional math rendering
User->>ExercicesPage : Navigate from lesson
ExercicesPage->>ExercicesPage : Load tasks from topic tasks directory
ExercicesPage-->>User : Display interactive exercises
```

**Diagram sources**
- [app/(main)/algebra/page.tsx](file://app/(main)/algebra/page.tsx#L4-L8)
- [app/(main)/geometry/page.tsx](file://app/(main)/geometry/page.tsx#L4-L8)
- [app/(main)/physics/page.tsx](file://app/(main)/physics/page.tsx#L4-L8)
- [components/SubjectPage.tsx](file://components/SubjectPage.tsx#L26-L33)
- [app/(main)/math/[topic]/lesson/page.tsx](file://app/(main)/math/[topic]/lesson/page.tsx#L29-L90)
- [app/(main)/math/[topic]/exercices/page.tsx](file://app/(main)/math/[topic]/exercices/page.tsx#L8-L31)

## Detailed Component Analysis

### Unified SubjectPage Component
The SubjectPage component serves as the central rendering engine for all subject pages:
- Accepts SubjectPageData and basePath props
- Renders page headers with subject titles and descriptions
- Generates lesson cards with subject-specific navigation paths
- Supports progress badges and responsive grid layouts

Key features:
- **BasePath integration**: Uses basePath prop to generate subject-specific lesson URLs
- **Responsive design**: Grid layout adapts from 1 column on mobile to 3 columns on desktop
- **Accessibility**: Proper ARIA labels and keyboard navigation support
- **Progress tracking**: Integrates with ProgressBadge component for lesson completion tracking

**Section sources**
- [components/SubjectPage.tsx](file://components/SubjectPage.tsx#L26-L33)
- [components/SubjectPage.tsx](file://components/SubjectPage.tsx#L149-L180)

### Individual Subject Page Components
Each subject page follows a consistent pattern:
- Import SubjectPage component and subject-specific allTopics JSON
- Cast JSON to SubjectPageData type
- Pass data and subject-specific basePath to SubjectPage component
- Maintain consistent structure across all subjects

Example implementations:
- **AlgebraPage**: Uses basePath='/algebra'
- **GeometryPage**: Uses basePath='/geometry'
- **PhysicsPage**: Uses basePath='/physics'

**Section sources**
- [app/(main)/algebra/page.tsx](file://app/(main)/algebra/page.tsx#L1-L9)
- [app/(main)/geometry/page.tsx](file://app/(main)/geometry/page.tsx#L1-L9)
- [app/(main)/physics/page.tsx](file://app/(main)/physics/page.tsx#L1-L9)

### Subject Catalog JSON Schema
Each subject's catalog is a JSON file with:
- **pageTitle**: The display title for the subject page.
- **pageDescription**: A brief description shown on the subject page.
- **sections**: An array of TopicSection objects, each with:
  - **title**: Section title.
  - **description**: Optional section description.
  - **lessons**: An array of Lesson objects, each with:
    - **title**: Lesson title.
    - **folder**: The topic folder name that contains the lesson content.

Example references:
- [content/algebra/allTopics.json](file://content/algebra/allTopics.json#L1-L12)
- [content/geometry/allTopics.json](file://content/geometry/allTopics.json#L1-L12)
- [content/physics/allTopics.json](file://content/physics/allTopics.json#L1-L12)
- [content/math/allTopics.json](file://content/math/allTopics.json#L1-L26)

Practical example: Adding a new lesson to an existing section
- Add a new topic folder under the appropriate subject content directory with an index.mdx and optional tasks.
- Update the subject catalog to include the new lesson with title and folder.
- Ensure the folder name matches the lesson's topic folder.

**Section sources**
- [content/algebra/allTopics.json](file://content/algebra/allTopics.json#L1-L12)
- [content/geometry/allTopics.json](file://content/geometry/allTopics.json#L1-L12)
- [content/physics/allTopics.json](file://content/physics/allTopics.json#L1-L12)
- [content/math/allTopics.json](file://content/math/allTopics.json#L1-L26)

### Lesson Content Model
Each lesson is stored as an MDX file with frontmatter:
- **title**: Lesson title.
- **description**: Lesson description.
- **difficulty**: Lesson difficulty level.
- **math**: Boolean flag enabling math rendering.

Loading and rendering:
- Lesson pages use a loader to extract content and frontmatter from MDX.
- Math rendering is enabled conditionally based on frontmatter flags.
- Lesson pages support static generation with explicit parameters.

Example references:
- [lib/loadLesson.ts](file://lib/loadLesson.ts#L6-L16)
- [app/(main)/math/[topic]/lesson/page.tsx](file://app/(main)/math/[topic]/lesson/page.tsx#L38-L80)

**Section sources**
- [types/lesson.ts](file://types/lesson.ts#L1-L6)
- [lib/loadLesson.ts](file://lib/loadLesson.ts#L6-L16)
- [app/(main)/math/[topic]/lesson/page.tsx](file://app/(main)/math/[topic]/lesson/page.tsx#L38-L80)

### Topic Configuration (Advanced Features)
Topic-level configuration supports advanced features like XP systems, scheduling, and categorization. While not required for basic lesson rendering, it enables richer functionality.

Key fields include:
- **slug**: Unique identifier for the topic.
- **title**: Topic title.
- **description**: Topic description.
- **difficulty**: Difficulty level.
- **category**: Category (e.g., math).
- **inListPosition**: Ordering hint.
- **tags**: Array of tags for discovery.

Example references:
- [content/math/addition_and_subtraction_of_fractions/config.json](file://content/math/addition_and_subtraction_of_fractions/config.json#L1-L10)
- [types/topic-config.ts](file://types/topic-config.ts#L3-L16)

**Section sources**
- [types/topic-config.ts](file://types/topic-config.ts#L1-L17)
- [content/math/addition_and_subtraction_of_fractions/config.json](file://content/math/addition_and_subtraction_of_fractions/config.json#L1-L10)

### Enhanced Navigation Patterns
The refactored system provides consistent navigation across all subjects:
- **Subject-specific routes**: `/algebra`, `/geometry`, `/physics` for individual subjects
- **Unified SubjectPage component**: Ensures consistent UI and navigation patterns
- **BasePath parameter**: Allows the same component to work across different subjects
- **Standardized exercise routes**: Per-topic exercise pages with bidirectional navigation

References:
- [components/SubjectPage.tsx](file://components/SubjectPage.tsx#L158-L166)
- [app/(main)/math/[topic]/lesson/page.tsx](file://app/(main)/math/[topic]/lesson/page.tsx#L82-L87)
- [app/(main)/math/[topic]/exercices/page.tsx](file://app/(main)/math/[topic]/exercices/page.tsx#L21-L27)

**Section sources**
- [components/SubjectPage.tsx](file://components/SubjectPage.tsx#L158-L166)
- [app/(main)/math/[topic]/lesson/page.tsx](file://app/(main)/math/[topic]/lesson/page.tsx#L82-L87)
- [app/(main)/math/[topic]/exercices/page.tsx](file://app/(main)/math/[topic]/exercices/page.tsx#L21-L27)

### Multi-Language Support
The system supports multi-language content by:
- Storing localized subject catalogs in each subject's content directory.
- Keeping lesson content localized in the respective topic folders.
- Maintaining consistent folder and file naming conventions across languages.

Examples:
- Subject catalogs use localized strings for titles and descriptions.
- Lesson MDX files include localized frontmatter and content.

References:
- [content/algebra/allTopics.json](file://content/algebra/allTopics.json#L2-L3)
- [content/geometry/allTopics.json](file://content/geometry/allTopics.json#L2-L3)
- [content/physics/allTopics.json](file://content/physics/allTopics.json#L2-L3)
- [content/math/allTopics.json](file://content/math/allTopics.json#L2-L3)

**Section sources**
- [content/algebra/allTopics.json](file://content/algebra/allTopics.json#L2-L3)
- [content/geometry/allTopics.json](file://content/geometry/allTopics.json#L2-L3)
- [content/physics/allTopics.json](file://content/physics/allTopics.json#L2-L3)
- [content/math/allTopics.json](file://content/math/allTopics.json#L2-L3)

### Practical Examples

#### Adding a New Subject
Steps:
- Create a new content directory for the subject (e.g., content/newsubject).
- Add a subject catalog file (e.g., content/newsubject/allTopics.json) with pageTitle, pageDescription, and initial sections.
- Create a Next.js page under app/(main)/newsubject/page.tsx that imports the catalog and renders it with SubjectPage using the appropriate basePath.
- Verify navigation appears consistently across the site.

References:
- [app/(main)/algebra/page.tsx](file://app/(main)/algebra/page.tsx#L1-L9)
- [components/SubjectPage.tsx](file://components/SubjectPage.tsx#L26-L33)

#### Creating Sections with Proper Metadata
Steps:
- In the subject catalog, add a section object with title and description.
- Optionally add lessons to the section with title and folder fields.
- Ensure folder names match the topic directories.

References:
- [content/math/allTopics.json](file://content/math/allTopics.json#L4-L24)

#### Organizing Lessons Within Topic Folders
Steps:
- Create a new topic folder under the appropriate subject content directory.
- Add an index.mdx with frontmatter (title, description, difficulty, math).
- Optionally add a tasks directory with JSON-formatted exercises.
- Reference the new topic folder in the subject catalog.

References:
- [content/math/natural_numbers/index.mdx](file://content/math/natural_numbers/index.mdx#L1-L14)
- [content/math/addition_and_subtraction_of_fractions/index.mdx](file://content/math/addition_and_subtraction_of_fractions/index.mdx#L1-L14)
- [app/(main)/math/[topic]/exercices/page.tsx](file://app/(main)/math/[topic]/exercices/page.tsx#L15-L17)

## Dependency Analysis
The system exhibits low coupling and clear separation of concerns with the new unified architecture:
- Individual subject pages depend on local JSON catalogs and the SubjectPage component.
- SubjectPage component handles all rendering logic and navigation.
- Lesson pages depend on loaders to parse MDX and frontmatter.
- Exercises depend on task loaders to assemble interactive content.

```mermaid
graph LR
ALG["Algebra Page"] --> ALG_CATALOG["content/algebra/allTopics.json"]
GEOM["Geometry Page"] --> GEOM_CATALOG["content/geometry/allTopics.json"]
PHYS["Physics Page"] --> PHYS_CATALOG["content/physics/allTopics.json"]
MATH["Math Page"] --> MATH_CATALOG["content/math/allTopics.json"]
SUBJECT_COMP["SubjectPage Component"]
ALG_CATALOG --> SUBJECT_COMP
GEOM_CATALOG --> SUBJECT_COMP
PHYS_CATALOG --> SUBJECT_COMP
MATH_CATALOG --> SUBJECT_COMP
SUBJECT_COMP --> LESSON_PAGE["Lesson Page"]
LESSON_PAGE --> LOAD_LESSON["loadLesson"]
LESSON_PAGE --> MDX["index.mdx"]
LESSON_PAGE --> EXERCICES_PAGE["Exercises Page"]
EXERCICES_PAGE --> LOAD_TASKS["loadTasks"]
EXERCICES_PAGE --> TASKS["tasks/*.json"]
```

**Diagram sources**
- [app/(main)/algebra/page.tsx](file://app/(main)/algebra/page.tsx#L1-L9)
- [app/(main)/geometry/page.tsx](file://app/(main)/geometry/page.tsx#L1-L9)
- [app/(main)/physics/page.tsx](file://app/(main)/physics/page.tsx#L1-L9)
- [app/(main)/math/page.tsx](file://app/(main)/math/page.tsx#L1-L9)
- [components/SubjectPage.tsx](file://components/SubjectPage.tsx#L26-L33)
- [content/math/allTopics.json](file://content/math/allTopics.json#L1-L26)
- [lib/loadLesson.ts](file://lib/loadLesson.ts#L6-L16)
- [lib/loadTasks.ts](file://lib/loadTasks.ts#L5-L30)
- [app/(main)/math/[topic]/lesson/page.tsx](file://app/(main)/math/[topic]/lesson/page.tsx#L38-L80)
- [app/(main)/math/[topic]/exercices/page.tsx](file://app/(main)/math/[topic]/exercices/page.tsx#L15-L17)

**Section sources**
- [components/SubjectPage.tsx](file://components/SubjectPage.tsx#L26-L33)
- [lib/loadLesson.ts](file://lib/loadLesson.ts#L6-L16)
- [lib/loadTasks.ts](file://lib/loadTasks.ts#L5-L30)

## Performance Considerations
- **Static generation**: Lesson pages use static generation with explicit parameters derived from the filesystem, ensuring predictable build-time behavior.
- **Minimal runtime work**: Frontmatter extraction and task loading are straightforward file reads with minimal overhead.
- **Conditional math rendering**: Math plugins are only applied when frontmatter indicates math content, reducing unnecessary processing.
- **Component reuse**: The unified SubjectPage component reduces code duplication and improves maintainability.
- **Subject-specific optimization**: Each subject page can be optimized independently while maintaining consistent performance patterns.

## Troubleshooting Guide
Common issues and resolutions:
- **Lesson not appearing in the subject catalog**:
  - Verify the lesson's folder name matches the folder field in the catalog.
  - Confirm the catalog references the lesson within the correct section.
  - Check that the basePath in the subject page matches the expected URL structure.
  - References: [content/math/allTopics.json](file://content/math/allTopics.json#L8-L13)

- **Lesson content not rendering**:
  - Ensure the index.mdx exists in the topic folder and contains valid frontmatter.
  - Verify the lesson page is accessible at the expected URL structure.
  - References: [content/math/natural_numbers/index.mdx](file://content/math/natural_numbers/index.mdx#L1-L6)

- **Math formulas not displaying**:
  - Set the math frontmatter flag to true in index.mdx.
  - References: [app/(main)/math/[topic]/lesson/page.tsx](file://app/(main)/math/[topic]/lesson/page.tsx#L43-L46)

- **Exercises not loading**:
  - Confirm the tasks directory exists and contains valid JSON files.
  - Verify the exercise page URL structure matches the lesson page.
  - References: [app/(main)/math/[topic]/exercices/page.tsx](file://app/(main)/math/[topic]/exercices/page.tsx#L15-L17)

- **Subject page not rendering correctly**:
  - Ensure the subject catalog JSON is properly formatted.
  - Verify the SubjectPage component receives the correct basePath.
  - Check that the subject page imports the correct allTopics JSON file.
  - References: [components/SubjectPage.tsx](file://components/SubjectPage.tsx#L26-L33)

**Section sources**
- [content/math/allTopics.json](file://content/math/allTopics.json#L8-L13)
- [content/math/natural_numbers/index.mdx](file://content/math/natural_numbers/index.mdx#L1-L6)
- [app/(main)/math/[topic]/lesson/page.tsx](file://app/(main)/math/[topic]/lesson/page.tsx#L43-L46)
- [app/(main)/math/[topic]/exercices/page.tsx](file://app/(main)/math/[topic]/exercices/page.tsx#L15-L17)
- [components/SubjectPage.tsx](file://components/SubjectPage.tsx#L26-L33)

## Conclusion
The subject organization system provides a scalable, content-driven architecture for structuring educational material across disciplines. The complete refactoring to individual subject pages with a unified SubjectPage component creates a more maintainable and extensible system. By using JSON catalogs for subject metadata, MDX for lesson content, and a shared rendering component, the system ensures consistent navigation and easy maintenance across all subjects. Multi-language support is achieved through localized catalogs and content, while optional topic configurations enable advanced features. The new architecture allows contributors to add subjects, sections, and lessons efficiently while preserving a uniform user experience across all subject areas.