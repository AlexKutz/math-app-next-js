# Task Component Code Splitting

## Overview

The task system implements **code splitting** using React's `lazy()` and `Suspense` to ensure that only the necessary task component code is loaded based on the actual task type being displayed. This significantly reduces the initial bundle size and improves loading performance.

## Impact Example

**Without Code Splitting:**

- User visits page with InputTask → Loads 150KB (all task components)
- User switches to CoordinatePlaneTask → No additional load (already bundled)
- **Total: 150KB loaded upfront**

**With Code Splitting:**

- User visits page with InputTask → Loads 30KB (only InputTask)
- User switches to CoordinatePlaneTask → Loads 45KB (CoordinatePlaneTask)
- **Total: 75KB loaded (50% reduction), loaded progressively**

## How It Works

### Before Code Splitting ❌

```typescript
// All task components loaded upfront
import { MultipleChoiceTask } from './MultipleChoiceTask';
import { InputTask } from './InputTask';
import { CoordinatePlaneTask } from './CoordinatePlaneTask';
// All code bundled together, even if not used
```

### After Code Splitting ✅

```typescript
// Task components loaded on-demand
const MultipleChoiceTask = lazy(() =>
  import('./MultipleChoiceTask').then((module) => ({
    default: module.MultipleChoiceTask,
  })),
);

const InputTask = lazy(() =>
  import('./InputTask').then((module) => ({
    default: module.InputTask,
  })),
);

const CoordinatePlaneTask = lazy(() =>
  import('./CoordinatePlaneTask').then((module) => ({
    default: module.CoordinatePlaneTask,
  })),
);
```

## Benefits

1. **Reduced Initial Bundle Size**: Only common code is loaded initially
2. **Faster Page Load**: Task components load only when needed
3. **Better Performance**: Especially important as you add more task types
4. **Automatic Code Splitting**: Next.js/Webpack handles the rest

## How to Add a New Task Type

### Step 1: Create Your Task Component

```typescript
// components/tasks/NewTaskType.tsx
'use client';

import { TNewTaskType } from '@/types/task';
import { TaskCard } from './TaskCard';

export function NewTaskType({ task, setAnswer, isLocked, initialAnswer }) {
  // Your task implementation
  return (
    <TaskCard question={task.question}>
      {/* Your UI */}
    </TaskCard>
  );
}
```

### Step 2: Add Type Definition

```typescript
// types/task.ts
export interface TNewTaskType {
  id: string;
  type: 'new-task-type';
  question: string;
  // Your specific fields
  difficulty?: 'easy' | 'medium' | 'hard';
  baseXP?: number;
}

export type TTask =
  | TMultipleChoiceTask
  | TInputTask
  | TCoordinatePlaneTask
  | TNewTaskType; // Add to union
```

### Step 3: Add Lazy Import

```typescript
// components/tasks/Tasks.tsx
const NewTaskType = lazy(() =>
  import('./NewTaskType').then((module) => ({
    default: module.NewTaskType,
  })),
);
```

### Step 4: Add to renderCurrentTask()

```typescript
const renderCurrentTask = () => {
  const submission = submissionResults[currentTask.id];
  const isLocked = !!submission;
  const initialAnswer = submission?.userAnswer;

  switch (currentTask.type) {
    // ... existing cases
    case 'new-task-type':
      return (
        <Suspense fallback={<TaskLoadingFallback />}>
          <NewTaskType
            task={currentTask}
            setAnswer={handleTaskSubmit}
            isLocked={isLocked}
            initialAnswer={/* parse your answer format */}
          />
        </Suspense>
      );
    default:
      return <div>Unknown task type</div>;
  }
};
```

### Step 5: Add Answer Validation

```typescript
// components/tasks/utils.ts
export const checkTaskAnswer = (task: TTask, answer: unknown): boolean => {
  // ... existing checks
  if (task.type === 'new-task-type') {
    // Your validation logic
    return true; // or false
  }
  return false;
};
```

### Step 6: Handle Answer Serialization (if needed)

```typescript
// components/tasks/hooks/useTaskSubmission.ts
const serializedAnswer =
  task.type === 'coordinate-plane' || task.type === 'new-task-type'
    ? JSON.stringify(answer)
    : answer;
```

## Bundle Analysis

To see the code splitting in action:

```bash
# Build the project
npm run build

# Analyze the bundle
npx @next/bundle-analyzer
```

You should see separate chunks for each task component:

- `MultipleChoiceTask-[hash].js`
- `InputTask-[hash].js`
- `CoordinatePlaneTask-[hash].js`
- `NewTaskType-[hash].js`

## Loading States

The `TaskLoadingFallback` component shows while a task component is being loaded:

```typescript
const TaskLoadingFallback = () => (
  <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <div className="text-center">
      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      <p className="text-sm text-gray-600 dark:text-gray-400">Завантаження завдання...</p>
    </div>
  </div>
);
```

## Best Practices

1. **Keep Task Components Independent**: Each task should be self-contained
2. **Use TaskCard Wrapper**: Maintains consistent styling across all task types
3. **Handle Loading States**: Always wrap lazy components with `Suspense`
4. **Type Safety**: Define proper TypeScript interfaces for each task type
5. **Consistent Props**: All tasks should accept similar base props (task, setAnswer, isLocked, initialAnswer)

## Performance Tips

- Task components are cached after first load
- Switching between tasks of the same type is instant
- Consider preloading common task types on user interaction
- Monitor bundle sizes as you add more task types

## Troubleshooting

### Task component not loading

- Check that the import path is correct
- Ensure the component is exported correctly
- Verify the Suspense boundary is in place

### TypeScript errors

- Make sure the task type is added to the `TTask` union
- Verify props match the component's interface
- Check that type narrowing works in switch cases

### Bundle still too large

- Verify lazy imports are used (not regular imports)
- Check Next.js build output for chunk sizes
- Consider further splitting large task components
