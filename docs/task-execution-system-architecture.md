# Task Execution System Architecture

## Overview

This document provides a comprehensive explanation of the task execution system in the math learning application, covering the complete flow from user interaction to database persistence, XP calculation, and spaced repetition mechanics.

---

## Table of Contents

1. [Complete Flow of Task Execution](#1-complete-flow-of-task-execution)
2. [XP Calculation and Awarding](#2-xp-calculation-and-awarding)
3. [Task Execution State Persistence](#3-task-execution-state-persistence)
4. [System Components](#4-system-components)
5. [XPService Role](#5-xpservice-role)
6. [Authentication Impact](#6-authentication-impact)
7. [Database Schema](#7-database-schema)
8. [Validation and Error Handling](#8-validation-and-error-handling)
9. [Daily Limits and SRS](#9-daily-limits-and-srs)
10. [Complete Data Flow](#10-complete-data-flow)

---

## 1. Complete Flow of Task Execution

### Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Task Component │────▶│  Tasks.tsx       │────▶│ useTaskSubmission│
│ (MultipleChoice │     │ (Main Container) │     │    Hook         │
│  /Input/Coord)  │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                              ┌───────────────────────────┘
                              ▼
                    ┌──────────────────┐
                    │  /api/tasks/submit│
                    │    POST Route    │
                    └────────┬─────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   XPService      │
                    │ (Business Logic) │
                    └────────┬─────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Prisma/Database │
                    │  (PostgreSQL)    │
                    └──────────────────┘
```

### Execution Steps

1. **User submits answer** → Task component (`MultipleChoiceTask`, `InputTask`, or `CoordinatePlaneTask`) calls `setAnswer` callback
2. **`Tasks.tsx`** receives the answer and calls `handleTaskSubmit` → delegates to `submitTask` from `useTaskSubmission` hook
3. **`useTaskSubmission.ts`** validates the answer locally using `checkTaskAnswer()`, plays sound if correct, then makes API call
4. **`/api/tasks/submit/route.ts`** receives the POST request, validates session, validates input data using Valibot schema
5. **`XPService`** processes the submission, calculates XP, updates SRS stage, and persists to database
6. **Response flows back** through the chain, updating UI state with results and XP information

---

## 2. XP Calculation and Awarding

### For Correct Answers

**Location:** `lib/xp/xpService.ts` - `submitCorrectTask()` method (lines 118-303)

#### Base XP Determination

```typescript
let baseXP = config.baseTaskXp; // Default from topic config
if (taskBaseXP !== undefined) baseXP = taskBaseXP;
else if (taskDifficulty) {
  const diff = taskDifficulty.toLowerCase();
  if (diff === 'easy') baseXP = 100;
  else if (diff === 'medium' || diff === 'moderate') baseXP = 250;
  else if (diff === 'hard') baseXP = 500;
}
```

#### Daily Multiplier System (Anti-Grind)

| Tasks Completed | Multiplier | XP Percentage |
| --------------- | ---------- | ------------- |
| 1-10            | 1.0        | 100%          |
| 11-20           | 0.5        | 50%           |
| 21+             | 0.1        | 10%           |

```typescript
// computeDailyMultiplier (lines 91-106)
if (idx <= fullEnd)
  return { multiplier: config.multiplierFull, dailyTaskIndex: idx };
if (idx <= halfEnd)
  return { multiplier: config.multiplierHalf, dailyTaskIndex: idx };
return { multiplier: config.multiplierLow, dailyTaskIndex: idx };
```

#### Final XP Calculation

```typescript
const xpEarned = Math.max(0, Math.round(baseXP * multiplier));
```

### For Incorrect Answers

**Location:** `lib/xp/xpService.ts` - `submitIncorrectTask()` method (lines 308-420)

- **XP Earned**: 0
- **SRS Stage**: Reset to 0
- **Next Review Date**: Tomorrow (1 day from now)
- **Message**: "❌ Неправильна відповідь. Спробуйте ще раз завтра!"

---

## 3. Task Execution State Persistence

### Database Transaction Flow

All database operations occur within a single Prisma transaction to ensure data consistency:

```typescript
return await prisma.$transaction(async (tx) => {
  // 1. Verify user exists
  const user = await tx.user.findUnique({ where: { id: userId } });

  // 2. Get topic configuration
  const configRow = await tx.topicXpConfig.findUnique({ where: { topicSlug } });

  // 3. Get or create user progress
  let progressRow = await tx.userTopicXp.findUnique({...});
  if (!progress) progressRow = await tx.userTopicXp.create({...});

  // 4. Create task attempt record
  await tx.userTaskAttempt.create({...});

  // 5. Update user XP progress
  const updated = await tx.userTopicXp.update({...});
});
```

### UserTopicXp State Updates

**Location:** `prisma/schema.prisma` (lines 99-122)

```typescript
{
  currentXp: newCurrentXp,        // Accumulated XP for current level
  totalXpEarned: newTotalXp,      // Lifetime XP earned
  level: newLevel,                // Computed from thresholds
  dailyTasksCount: dailyTasksCountBefore + 1,
  dailyTasksDate: new Date(todayISO),
  srsStage: stageAfter,           // SRS progression stage
  nextReviewDate: nextReviewDate, // When topic should be reviewed
  lastPracticedDate: new Date(todayISO),
  lastActivity: new Date(),
}
```

### UserTaskAttempt Record

**Location:** `prisma/schema.prisma` (lines 124-143)

```typescript
{
  userId, taskId, topicSlug,
  xpEarned,                      // XP awarded for this attempt
  isCorrect,                     // Boolean success flag
  nextReviewDate,                // Individual task review date
  reviewCount: stageAfter,       // How many times reviewed
  masteryLevel: level,           // Current mastery level
  userAnswer: String(userAnswer), // Serialized user response
}
```

---

## 4. System Components

### Frontend Components

| Component             | File                                       | Purpose                                     |
| --------------------- | ------------------------------------------ | ------------------------------------------- |
| `Tasks.tsx`           | `components/tasks/Tasks.tsx`               | Main container, orchestrates task rendering |
| `MultipleChoiceTask`  | `components/tasks/MultipleChoiceTask.tsx`  | Multiple choice question UI                 |
| `InputTask`           | `components/tasks/InputTask.tsx`           | Text input question UI                      |
| `CoordinatePlaneTask` | `components/tasks/CoordinatePlaneTask.tsx` | Interactive coordinate plane                |
| `TaskNavigation`      | `components/tasks/TaskNavigation.tsx`      | Task selector sidebar                       |
| `UserXPDisplay`       | `components/tasks/UserXPDisplay.tsx`       | XP and energy bar display                   |
| `TaskResultDisplay`   | `components/tasks/TaskResultDisplay.tsx`   | Submission feedback                         |

### Custom Hooks

| Hook                | File                                          | Purpose                              |
| ------------------- | --------------------------------------------- | ------------------------------------ |
| `useTaskSubmission` | `components/tasks/hooks/useTaskSubmission.ts` | Handles answer submission, API calls |
| `useUserXP`         | `components/tasks/hooks/useUserXP.ts`         | Fetches user XP data on load         |
| `useTaskNavigation` | `components/tasks/hooks/useTaskNavigation.ts` | Manages task progression logic       |
| `useAudio`          | `components/tasks/hooks/useAudio.ts`          | Sound effect management              |

### API Routes

| Route                    | File                            | Purpose             |
| ------------------------ | ------------------------------- | ------------------- |
| `POST /api/tasks/submit` | `app/api/tasks/submit/route.ts` | Submit task answers |
| `GET /api/xp/user`       | `app/api/xp/user/route.ts`      | Fetch user XP data  |

### Backend Services

| Service     | File                  | Purpose                                   |
| ----------- | --------------------- | ----------------------------------------- |
| `XPService` | `lib/xp/xpService.ts` | Core XP calculation and persistence logic |

---

## 5. XPService Role

The `XPService` class is the central business logic layer for all XP-related operations.

### Key Methods

| Method                   | Lines   | Purpose                                          |
| ------------------------ | ------- | ------------------------------------------------ |
| `submitCorrectTask()`    | 118-303 | Main entry for correct answers, handles XP + SRS |
| `submitIncorrectTask()`  | 308-420 | Handles incorrect answer logic                   |
| `calculateXP()`          | 503-607 | Legacy XP calculation (used for previews)        |
| `getUserTopicXP()`       | 452-477 | Retrieve user's XP for a topic                   |
| `getTopicConfig()`       | 440-447 | Get topic configuration                          |
| `getCompletedTaskIds()`  | 886-921 | Get list of attempted tasks                      |
| `getTasksDueForReview()` | 735-799 | SRS: Get tasks needing review                    |
| `saveTaskAttempt()`      | 658-730 | Persist task attempt                             |

### Helper Methods

- `computeDailyMultiplier()` - Anti-grind multiplier calculation
- `computeLevelFromThresholds()` - Level progression logic
- `mapTopicConfigRow()` / `mapUserTopicXPRow()` - Database row mapping
- `toISODateString()` - Date normalization for comparisons

---

## 6. Authentication Impact

### Authenticated Users

```typescript
// From useTaskSubmission.ts (lines 88-142)
if (session?.user) {
  setIsSubmitting(true);
  const response = await fetch('/api/tasks/submit', {...});
  // XP saved to database
  // SRS progression tracked
  // Progress persisted across sessions
}
```

**Benefits:**

- XP permanently saved to database
- SRS (Spaced Repetition) tracking active
- Progress visible across devices
- Level progression maintained
- Task history recorded

### Unauthenticated Users

```typescript
// From useTaskSubmission.ts (lines 47-84)
if (!session?.user) {
  const result: TaskSubmissionResponse = {
    success: isCorrect,
    message: isCorrect
      ? '✨ Правильно! Авторизуйтесь, щоб зберігати прогрес.'
      : '❌ Неправильна відповідь.',
  };
  // No database persistence
  // Progress lost on page refresh
}
```

---

## 7. Database Schema

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    User     │◄──────┤   UserTopicXp   │◄──────┤  TopicXpConfig  │
│  (users)    │  1:M  │ (user_topic_xp) │  M:1  │(topic_xp_config)│
└──────┬──────┘       └─────────────────┘       └─────────────────┘
       │
       │              ┌─────────────────┐
       └─────────────►│ UserTaskAttempt │
              1:M     │(user_task_attempts)
                      └─────────────────┘
```

### User Model

**Location:** `prisma/schema.prisma` (lines 19-34)

```prisma
model User {
  id            String    @id @default(uuid()) @db.Uuid
  name          String?
  email         String?   @unique
  role          AuthRole  @default(USER)
  userTopicXp      UserTopicXp[]      // One-to-many
  userTaskAttempts UserTaskAttempt[]  // One-to-many
}
```

### TopicXpConfig

**Location:** `prisma/schema.prisma` (lines 70-97)

```prisma
model TopicXpConfig {
  id              Int      @id @default(autoincrement())
  topicSlug       String   @unique
  topicTitle      String
  baseTaskXp      Int      @default(100)
  dailyFullTasks  Int      @default(10)
  dailyHalfTasks  Int      @default(10)
  multiplierFull  Decimal  @default(1.0)
  multiplierHalf  Decimal  @default(0.5)
  multiplierLow   Decimal  @default(0.1)
  levelThresholds Int[]    @default([1000, 2500, 4500, 7000, 10000])
  reviewIntervals Int[]    @default([1, 3, 7, 14, 30])
  // Relations...
}
```

### UserTopicXp

**Location:** `prisma/schema.prisma` (lines 99-122)

```prisma
model UserTopicXp {
  id                Int       @id @default(autoincrement())
  userId            String    @db.Uuid
  topicSlug         String    @db.VarChar(255)
  currentXp         Int       @default(0)
  totalXpEarned     Int       @default(0)
  level             Int       @default(0)
  dailyTasksCount   Int       @default(0)
  srsStage          Int       @default(0)
  nextReviewDate    DateTime? @db.Date
  @@unique([userId, topicSlug])
}
```

### UserTaskAttempt

**Location:** `prisma/schema.prisma` (lines 124-143)

```prisma
model UserTaskAttempt {
  id             Int       @id @default(autoincrement())
  userId         String    @db.Uuid
  taskId         String    @db.VarChar(255)
  topicSlug      String    @db.VarChar(255)
  xpEarned       Int       @default(0)
  isCorrect      Boolean   @default(true)
  nextReviewDate DateTime? @db.Date
  reviewCount    Int       @default(0)
  masteryLevel   Int       @default(0)
  userAnswer     String?   @db.Text
  @@index([userId, topicSlug])
}
```

---

## 8. Validation and Error Handling

### Input Validation

**Location:** `lib/validation/schemas.ts`

```typescript
export const TaskSubmissionSchema = v.object({
  taskId: v.pipe(v.string(), v.minLength(1), v.maxLength(255)),
  topicSlug: v.pipe(v.string(), v.minLength(1), v.maxLength(255)),
  isCorrect: v.boolean(),
  userAnswer: v.optional(
    v.union([v.string(), v.number(), v.array(v.any()), v.null_()]),
  ),
  baseXP: v.optional(v.pipe(v.number(), v.minValue(1))),
  difficulty: v.optional(v.picklist(['easy', 'medium', 'hard'])),
});
```

### Error Handling Flow

1. **Validation Errors** (400 Bad Request)

   ```typescript
   if (error.message?.includes('Validation failed:')) {
     return NextResponse.json(createValidationError(error.message), {
       status: 400,
     });
   }
   ```

2. **Authentication Errors** (401 Unauthorized)

   ```typescript
   if (!session?.user?.id) {
     return NextResponse.json(
       { success: false, error: 'Unauthorized' },
       { status: 401 },
     );
   }
   ```

3. **User Not Found Error** (FK violation prevention)

   ```typescript
   const user = await tx.user.findUnique({ where: { id: userId } });
   if (!user) {
     throw new Error(`Користувача з ID ${userId} не знайдено...`);
   }
   ```

4. **Server Errors** (500 Internal Server Error)
   ```typescript
   return NextResponse.json(
     { success: false, error: error.message || 'Internal server error' },
     { status: 500 },
   );
   ```

---

## 9. Daily Limits and SRS

### Daily Task Limits System

The anti-grind system prevents excessive XP farming:

| Tasks Completed | Multiplier | XP Percentage |
| --------------- | ---------- | ------------- |
| 1-10            | 1.0        | 100%          |
| 11-20           | 0.5        | 50%           |
| 21+             | 0.1        | 10%           |

### SRS (Spaced Repetition System)

**Review Intervals:** `[1, 3, 7, 14, 30]` days

**SRS Logic** (`lib/xp/xpService.ts` lines 180-226):

```typescript
// Determine if it's time for review
const isHotTopic = !nextReviewISO || nextReviewISO <= todayISO;
const isTooEarly = !isHotTopic;

// SRS stage only increases for scheduled reviews
const stageAfter = isTooEarly ? stageBefore : stageBefore + 1;

// Calculate next review date
const nextReviewDate = isTooEarly
  ? progress.nextReviewDate // Keep same date if too early
  : this.addDaysAsDate(now, intervals[stageBefore]);
```

**Key Behaviors:**

- **Hot Topic** (`isHotTopic`): Topic is due for review → Full SRS progression
- **Too Early** (`isTooEarly`): User practicing before scheduled review → XP awarded but no SRS advancement
- **Level Thresholds:** `[1000, 2500, 4500, 7000, 10000]` XP for levels 1-5

---

## 10. Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERACTION                                │
│  User selects answer in MultipleChoiceTask/InputTask/CoordinatePlaneTask    │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND PROCESSING                                │
│  1. Task component calls setAnswer(taskId, answer)                          │
│  2. Tasks.tsx → handleTaskSubmit → submitTask()                             │
│  3. useTaskSubmission validates answer with checkTaskAnswer()               │
│  4. Plays sound if correct                                                  │
│  5. Serializes answer (JSON for coordinate-plane)                           │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API REQUEST                                        │
│  POST /api/tasks/submit                                                     │
│  {                                                                          │
│    taskId: "task-123",                                                      │
│    topicSlug: "linear_equations",                                           │
│    isCorrect: true,                                                         │
│    userAnswer: "42" | 2 | "[{\"x\":1,\"y\":2}]",                            │
│    baseXP: 250,                                                             │
│    difficulty: "medium"                                                     │
│  }                                                                          │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND PROCESSING                                 │
│  1. route.ts validates session with auth()                                  │
│  2. Validates request body with TaskSubmissionSchema (Valibot)              │
│  3. Calls XPService.submitCorrectTask() or submitIncorrectTask()            │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE TRANSACTION                               │
│  1. Verify user exists                                                      │
│  2. Fetch topic configuration                                               │
│  3. Get/create UserTopicXp record                                           │
│  4. Calculate XP with daily multiplier                                      │
│  5. Determine SRS stage progression                                         │
│  6. Create UserTaskAttempt record                                           │
│  7. Update UserTopicXp with new XP, level, SRS data                         │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RESPONSE FLOW                                      │
│  {                                                                          │
│    success: true,                                                           │
│    xpResult: { xpEarned, nextReviewDate, masteryLevel, multiplier, ... },   │
│    userXP: { currentXp, totalXpEarned, level, ... },                        │
│    message: "✅ Повторення за графіком · +250 XP"                           │
│  }                                                                          │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           UI UPDATES                                         │
│  1. TaskResultDisplay shows success message and XP details                  │
│  2. UserXPDisplay updates XP bar and level                                  │
│  3. If auto-transition enabled: progress bar animates, then navigates       │
│  4. Task marked as completed, next unattempted task selected                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Files Reference

| File                                          | Purpose                                          |
| --------------------------------------------- | ------------------------------------------------ |
| `lib/xp/xpService.ts`                         | Core XP calculation and database operations      |
| `lib/tasks/taskValidator.ts`                  | Server-side task loading and answer validation   |
| `app/api/tasks/submit/route.ts`               | Task submission API endpoint                     |
| `app/api/xp/user/route.ts`                    | User XP data retrieval endpoint                  |
| `components/tasks/hooks/useTaskSubmission.ts` | Frontend submission logic                        |
| `components/tasks/hooks/useUserXP.ts`         | User XP data fetching                            |
| `components/tasks/Tasks.tsx`                  | Main task container component                    |
| `components/tasks/utils.ts`                   | Task utilities and answer checking (client-side) |
| `lib/validation/schemas.ts`                   | Input validation schemas                         |
| `prisma/schema.prisma`                        | Database schema definitions                      |
| `types/xp.ts`                                 | XP-related TypeScript types                      |
| `types/task.ts`                               | Task-related TypeScript types                    |

---

## 11. Analysis: Potential Problems and Improvements

### 11.1 Performance Bottlenecks

#### ✅ FIXED: N+1 Query in `getTasksDueForReview()`

**Status:** **RESOLVED** - Optimized to single query

**Location:** `lib/xp/xpService.ts` - `getTasksDueForReview()` method

**Problem:** The original implementation made N+1 database queries:

1. One query to get distinct task IDs
2. N queries (one per task) to get the most recent attempt

**Solution:** Replaced with single raw SQL query using PostgreSQL's `DISTINCT ON`:

```typescript
// OPTIMIZED: Single query using raw SQL
const attempts = await prisma.$queryRaw<
  Array<{
    taskId: string;
    nextReviewDate: Date;
    masteryLevel: number;
    reviewCount: number;
  }>
>`
  SELECT DISTINCT ON (task_id)
    task_id as "taskId",
    next_review_date as "nextReviewDate",
    mastery_level as "masteryLevel",
    review_count as "reviewCount"
  FROM user_task_attempts
  WHERE user_id = ${userId}::uuid
    AND topic_slug = ${topicSlug}
    AND next_review_date <= ${today}::date
    AND mastery_level < 5
    AND is_correct = true
  ORDER BY task_id, completed_at DESC
`;
```

**Performance Improvement:**

- **Before:** 1 + N queries (where N = number of tasks due for review)
- **After:** 1 query regardless of task count
- **Impact:** Significant reduction in database round-trips for users with many pending reviews

#### Problem: Synchronous Audio Playback

**Location:** `components/tasks/hooks/useAudio.ts` (line 28)

```typescript
const playCorrectAnswerSound = () => {
  correctAnswerSoundRef.current?.play().catch((error) => {
    console.debug('Audio playback failed:', error);
  });
};
```

**Impact:** Audio playback can block or fail due to browser autoplay policies, and errors are only logged to debug console.

**Recommendation:**

- Preload audio files
- Implement proper error handling with user feedback
- Consider using the Web Audio API for better control

#### Problem: No Request Debouncing/Throttling

**Location:** `components/tasks/hooks/useTaskSubmission.ts`

**Impact:** Users can rapidly click submit buttons, causing multiple API requests.

**Recommendation:** Add debouncing to the submit function:

```typescript
import { useCallback } from 'react';
import debounce from 'lodash/debounce';

const submitTask = useCallback(
  debounce(async (taskId, answer, ...) => {
    // submission logic
  }, 300),
  [dependencies]
);
```

### 11.2 Security Concerns

#### ✅ FIXED: Client-Side Answer Validation

**Status:** **RESOLVED** - Server-side validation implemented

**Location:** `lib/tasks/taskValidator.ts` (new file)

**Solution:** Created server-side task validator that loads tasks and validates answers without exposing correct answers to the client:

```typescript
// lib/tasks/taskValidator.ts
export async function loadTaskById(
  taskId: string,
  topicSlug: string,
): Promise<TTask | null> {
  // Loads tasks from server-side storage only
  // Correct answers never exposed to client
}

export function validateTaskAnswer(task: TTask, userAnswer: unknown): boolean {
  switch (task.type) {
    case 'multiple-choice':
      return validateMultipleChoiceAnswer(task, userAnswer);
    case 'input':
      return validateInputAnswer(task, userAnswer);
    case 'coordinate-plane':
      return validateCoordinatePlaneAnswer(task, userAnswer);
  }
}
```

---

#### ✅ FIXED: Trusting Client-Sent `isCorrect` Flag

**Status:** **RESOLVED** - `isCorrect` removed from API contract

**Changes Made:**

1. **API Route** (`app/api/tasks/submit/route.ts`):

```typescript
// BEFORE: Trusted client-sent isCorrect
const { taskId, topicSlug, isCorrect, userAnswer } = validatedData;

// AFTER: Server validates independently
const { taskId, topicSlug, userAnswer } = validatedData;
const task = await loadTaskById(taskId, topicSlug);
const isCorrect = validateTaskAnswer(task, userAnswer);
```

2. **Validation Schema** (`lib/validation/schemas.ts`):

```typescript
// isCorrect REMOVED from schema
export const TaskSubmissionSchema = v.object({
  taskId: v.string(),
  topicSlug: v.string(),
  // isCorrect: v.boolean(), // REMOVED - server validates
  userAnswer: v.optional(v.any()),
});
```

3. **Frontend** (`components/tasks/hooks/useTaskSubmission.ts`):

```typescript
// isCorrect no longer sent to server
body: JSON.stringify({
  taskId,
  topicSlug,
  // isCorrect, // REMOVED
  userAnswer: serializedAnswer,
});
```

---

#### ✅ FIXED: No Rate Limiting on Task Submission

**Status:** **RESOLVED** - Rate limiting implemented

**Location:** `app/api/tasks/submit/route.ts`

**Solution:** Added in-memory rate limiting (10 requests per minute per user):

```typescript
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false; // Rate limit exceeded
  }

  userLimit.count++;
  return true;
}
```

**Note:** For production, migrate to Redis-based rate limiting for distributed deployments.

---

#### ✅ FIXED: Potential SQL Injection via `userAnswer`

**Status:** **RESOLVED** - Input sanitization implemented

**Location:** `lib/tasks/taskValidator.ts`

**Solution:** Added `sanitizeUserAnswer()` function:

```typescript
export function sanitizeUserAnswer(answer: unknown): string | null {
  if (answer === null || answer === undefined) {
    return null;
  }

  // Serialize based on type
  let serialized: string;
  if (typeof answer === 'string') serialized = answer;
  else if (typeof answer === 'number') serialized = String(answer);
  else if (Array.isArray(answer)) serialized = JSON.stringify(answer);
  else serialized = String(answer);

  // Limit storage size (10KB max)
  const MAX_LENGTH = 10000;
  if (serialized.length > MAX_LENGTH) {
    serialized = serialized.substring(0, MAX_LENGTH);
  }

  // XSS prevention
  serialized = serialized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '');

  return serialized;
}
```

---

### Remaining Security Considerations

While the critical issues have been resolved, consider these additional improvements:

1. **Move to Redis for rate limiting** - Current in-memory solution resets on deployment
2. **Add CAPTCHA for suspicious activity** - After N failed attempts
3. **Implement request signing** - For additional tamper protection
4. **Add audit logging** - Track all XP-modifying operations

### 11.3 Code Maintainability Issues

#### ✅ FIXED: Type Assertions in InputTask

**Status:** **RESOLVED** - Removed all `as any` type assertions

**Location:** `components/tasks/InputTask.tsx`

**Problem:** Multiple `as any` type assertions were bypassing TypeScript's type safety:

```typescript
// BEFORE: Type assertions everywhere
const acceptedList: string[] = Array.isArray((task as any).accepted)
  ? (task as any).accepted
  : [(task as any).accepted];

// Used (task as any).correct in multiple places
normalize(initialAnswer) === normalize((task as any).correct);
```

**Solution:** Removed all `as any` assertions since `TInputTask` already has proper types:

```typescript
// AFTER: Proper type-safe code
const acceptedList: string[] = Array.isArray(task.accepted)
  ? task.accepted
  : task.accepted
    ? [task.accepted]
    : [];

// Direct property access with proper types
normalize(initialAnswer) === normalize(task.correct);
```

**Changes Made:**

1. Removed `(task as any).accepted` → `task.accepted`
2. Removed `(task as any).correct` → `task.correct`
3. Added `acceptedList` to useEffect dependency array (best practice)

**Result:** Full TypeScript type safety without any `as any` assertions.

#### ✅ FIXED: Magic Numbers Throughout Codebase

**Status:** **RESOLVED** - All magic numbers centralized in config

**Locations Fixed:**

| File                            | Before                            | After                                         |
| ------------------------------- | --------------------------------- | --------------------------------------------- |
| `lib/xp/xpService.ts`           | `100, 250, 500` (base XP)         | `XP_CONFIG.BASE_XP.EASY/MEDIUM/HARD`          |
| `lib/xp/xpService.ts`           | `[1000, 2500, 4500, 7000, 10000]` | `[...XP_CONFIG.LEVEL_THRESHOLDS]`             |
| `lib/xp/xpService.ts`           | `10, 10` (daily tasks)            | `XP_CONFIG.DATABASE_DEFAULTS.DAILY_*`         |
| `lib/xp/xpService.ts`           | `1000 * 60 * 60 * 24`             | `XP_CONFIG.TIME.MS_PER_DAY`                   |
| `components/tasks/utils.ts`     | `TASK_TRANSITION_DELAY = 2000`    | `XP_CONFIG.TIMING.TASK_TRANSITION_DELAY_MS`   |
| `app/api/tasks/submit/route.ts` | `60 * 1000, 10` (rate limit)      | `XP_CONFIG.RATE_LIMIT.WINDOW_MS/MAX_REQUESTS` |
| `lib/tasks/taskValidator.ts`    | `MAX_LENGTH = 10000`              | `XP_CONFIG.VALIDATION.MAX_ANSWER_LENGTH`      |

**Solution:** Created centralized configuration file:

```typescript
// lib/config/xpConfig.ts
export const XP_CONFIG = {
  BASE_XP: {
    EASY: 100,
    MEDIUM: 250,
    HARD: 500,
  },
  LEVEL_THRESHOLDS: [1000, 2500, 4500, 7000, 10000],
  DAILY_TASKS: {
    FULL_XP: 10,
    HALF_XP: 10,
  },
  MULTIPLIERS: {
    FULL: 1.0,
    HALF: 0.5,
    LOW: 0.1,
    EARLY: 0.1,
  },
  TIMING: {
    TASK_TRANSITION_DELAY_MS: 2000,
  },
  RATE_LIMIT: {
    MAX_REQUESTS: 10,
    WINDOW_MS: 60 * 1000,
  },
  VALIDATION: {
    MAX_ANSWER_LENGTH: 10000,
  },
  TIME: {
    MS_PER_DAY: 24 * 60 * 60 * 1000,
  },
  // ... and more
} as const;
```

**Benefits:**

- ✅ Single source of truth for all XP-related constants
- ✅ Type-safe with `as const` assertion
- ✅ Self-documenting code (names explain purpose)
- ✅ Easy to adjust values without hunting through codebase
- ✅ Helper functions for common calculations

#### ✅ FIXED: Duplicated Date Logic

**Status:** **RESOLVED** - Date utilities centralized

**Location:** `lib/xp/xpService.ts` and `components/tasks/utils.ts`

**Problem:** Both files contained similar date comparison logic:

```typescript
// xpService.ts (duplicated)
private static toISODateString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// utils.ts (different implementation, same purpose)
export const getTodayDateString = (): string =>
  new Date().toISOString().slice(0, 10);
```

**Solution:** Created shared date utility module:

```typescript
// lib/utils/dateUtils.ts
export function toISODateString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getTodayDateString(): string {
  return toISODateString(new Date());
}

export function addDays(date: Date, days: number): Date {...}
export function isSameDay(date1: Date, date2: Date): boolean {...}
export function isToday(date: Date): boolean {...}
export function daysBetween(date1: Date, date2: Date): number {...}
export type DateLike = Date | string | null | undefined;
export function toDate(value: DateLike): Date | null {...}
export function toISODateStringSafe(value: DateLike): string | null {...}
export function isBeforeOrEqual(d1: DateLike, d2: DateLike): boolean {...}
export function isAfter(d1: DateLike, d2: DateLike): boolean {...}
```

**Files Updated:**

- `lib/xp/xpService.ts` - Uses shared `toISODateString` and `addDays`
- `components/tasks/utils.ts` - Uses shared date utilities
- `lib/utils/dateUtils.ts` - Created new shared module

**Benefits:**

- ✅ Single source of truth for date operations
- ✅ Consistent date handling across the application
- ✅ Additional utility functions available (isSameDay, daysBetween, etc.)
- ✅ Type-safe with DateLike type
- ✅ Null-safe operations with toDate() and toISODateStringSafe()

#### ✅ FIXED: Large Component Files

**Status:** **RESOLVED** - Decomposed into focused components

**Location:** `components/tasks/Tasks.tsx`

**Problem:** The original Tasks component was 259 lines and handled too many responsibilities:

- Task lazy loading setup
- Loading fallback UI
- Task rendering switch statement
- UI layout and buttons
- Progress bar animation
- Empty/loading states

**Solution:** Decomposed into 5 focused components:

```
components/tasks/
├── Tasks.tsx                 # Main orchestrator (now ~100 lines)
├── TaskRenderer.tsx          # Renders task types with lazy loading
├── TaskActionButtons.tsx     # Continue/next buttons
├── TransitionProgressBar.tsx # Auto-transition animation
├── EmptyTasksState.tsx       # No tasks message
└── TasksLoadingState.tsx     # Loading placeholder
```

**New Component Responsibilities:**

| Component                   | Lines | Responsibility                              |
| --------------------------- | ----- | ------------------------------------------- |
| `Tasks.tsx`                 | ~100  | Orchestration, hook coordination, layout    |
| `TaskRenderer.tsx`          | ~91   | Task type switching, lazy loading, Suspense |
| `TaskActionButtons.tsx`     | ~45   | Button rendering based on result            |
| `TransitionProgressBar.tsx` | ~39   | Progress bar animation                      |
| `EmptyTasksState.tsx`       | ~15   | Empty state message                         |
| `TasksLoadingState.tsx`     | ~10   | Loading placeholder                         |

**Benefits:**

- ✅ Each component has a single, clear responsibility
- ✅ Easier to test individual components
- ✅ Better code reuse (components can be used elsewhere)
- ✅ Easier to maintain and understand
- ✅ Reduced cognitive load when reading code

### 11.4 User Experience Issues

#### Problem: No Offline Support for Task Submission

**Location:** `components/tasks/hooks/useTaskSubmission.ts`

**Impact:** Users lose progress if they submit answers while offline.

**Recommendation:** Implement offline queue with background sync:

```typescript
// Store failed submissions in IndexedDB
// Retry when connection is restored
const submitWithOfflineSupport = async (taskData) => {
  if (!navigator.onLine) {
    await queueForLater(taskData);
    showMessage('Answer saved. Will sync when online.');
    return;
  }
  // normal submission
};
```

#### Problem: No Loading State During Submission

**Location:** `components/tasks/Tasks.tsx`

**Impact:** Users may not know if their answer is being processed, leading to double submissions.

**Recommendation:** Add visual feedback during API calls:

```typescript
const [isSubmitting, setIsSubmitting] = useState(false);
// Show spinner or disable inputs while isSubmitting
```

#### Problem: Auto-Transition Can Be Disorienting

**Location:** `components/tasks/utils.ts` (line 5)

```typescript
export const IS_AUTO_TRANSITION = true;
```

**Impact:** Users may not have time to review feedback before being moved to the next task.

**Recommendation:**

- Make auto-transition optional (user preference)
- Add a "Pause" button during the transition delay
- Show a countdown timer

#### Problem: Limited Accessibility

**Location:** `components/tasks/MultipleChoiceTask.tsx`

**Impact:** Task components lack ARIA attributes, keyboard navigation, and screen reader support.

**Recommendation:**

```typescript
<button
  role="radio"
  aria-checked={isSelected}
  aria-label={`Option ${i + 1}: ${opt.text}`}
  tabIndex={selected === null ? 0 : -1}
  // ...
>
```

### 11.5 Database Optimization Opportunities

#### Problem: Missing Indexes for Common Queries

**Location:** `prisma/schema.prisma`

Current indexes:

```prisma
@@index([userId, topicSlug], map: "idx_user_task_attempts_user_topic")
@@index([nextReviewDate], map: "idx_user_task_attempts_next_review")
```

**Missing indexes for:**

- `taskId` lookups (frequent in `getCompletedTaskIds`)
- `completedAt` for sorting (used in `getTaskHistory`)
- Composite index for `(userId, topicSlug, isCorrect)`

**Recommendation:**

```prisma
@@index([userId, topicSlug, isCorrect], map: "idx_attempts_user_topic_correct")
@@index([taskId], map: "idx_attempts_task")
@@index([completedAt], map: "idx_attempts_completed")
```

#### Problem: No Database Connection Pooling Configuration

**Location:** `lib/prisma.ts`

```typescript
const pool = new Pool({ connectionString });
```

**Impact:** Default pool settings may not be optimal for production load.

**Recommendation:**

```typescript
const pool = new Pool({
  connectionString,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

#### Problem: Potential Race Condition in Daily Task Count

**Location:** `lib/xp/xpService.ts` (lines 166-174)

```typescript
const now = new Date();
const todayISO = this.toISODateString(now);
const progressDateISO = progress.dailyTasksDate
  ? this.toISODateString(new Date(progress.dailyTasksDate))
  : null;
const isNewDay = progressDateISO !== todayISO;
```

**Impact:** If a user submits multiple tasks simultaneously, the daily task count could be incorrect.

**Recommendation:** Use database-level atomic operations or row-level locking within the transaction.

### 11.6 Architectural Improvements

#### Problem: Monolithic XPService

**Location:** `lib/xp/xpService.ts` (922 lines)

**Impact:** The service handles too many responsibilities: XP calculation, SRS logic, database operations, and statistics.

**Recommendation:** Split into focused services:

```
lib/xp/
  ├── XPCalculationService.ts    # XP math and multipliers
  ├── SRSService.ts              # Spaced repetition logic
  ├── TaskAttemptService.ts      # Task attempt CRUD
  ├── UserProgressService.ts     # User XP tracking
  └── index.ts                   # Re-exports
```

#### Problem: No Caching Layer

**Impact:** Every task submission fetches topic config and user progress from the database.

**Recommendation:** Implement Redis caching:

```typescript
// Cache topic configs (rarely change)
const topicConfig =
  (await cache.get(`topic:${topicSlug}`)) ??
  (await fetchFromDatabase(topicSlug));

// Cache user progress with short TTL
const userXP =
  (await cache.get(`xp:${userId}:${topicSlug}`)) ??
  (await fetchFromDatabase(userId, topicSlug));
```

#### Problem: No Event System for XP Changes

**Impact:** Other parts of the application (leaderboards, achievements) cannot react to XP gains.

**Recommendation:** Implement an event emitter:

```typescript
// events/xpEvents.ts
export const xpEvents = new EventEmitter();

// In XPService
xpEvents.emit('xp:earned', { userId, topicSlug, xpEarned, level });

// Achievement service listens
xpEvents.on('xp:earned', checkAchievements);
```

#### Problem: No API Versioning

**Location:** `app/api/tasks/submit/route.ts`

**Impact:** Future API changes may break existing clients.

**Recommendation:** Add versioning to API routes:

```
app/api/
  └── v1/
      └── tasks/
          └── submit/
              └── route.ts
```

### 11.7 Testing and Monitoring Gaps

#### Problem: No Health Checks for XP Service

**Impact:** Database connection issues may not be detected until users report problems.

**Recommendation:** Add health check endpoint:

```typescript
// app/api/health/route.ts
export async function GET() {
  const dbHealthy = await checkDatabaseConnection();
  const cacheHealthy = await checkCacheConnection();
  return NextResponse.json({
    status: dbHealthy && cacheHealthy ? 'healthy' : 'unhealthy',
    services: { db: dbHealthy, cache: cacheHealthy },
  });
}
```

#### Problem: Limited Error Tracking

**Location:** `lib/xp/xpService.ts` (line 131, 319)

```typescript
console.error(`[XPService] User not found: ${userId}`);
```

**Impact:** Console logs are not persisted or aggregated for analysis.

**Recommendation:** Integrate with error tracking (Sentry, LogRocket):

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.captureException(error, {
  extra: { userId, topicSlug, taskId },
});
```

### 11.8 Data Integrity Issues

#### Problem: Decimal Precision Loss

**Location:** `lib/xp/xpService.ts` (lines 14-19)

```typescript
const toNumber = (value: any): number => {
  if (value instanceof Prisma.Decimal) {
    return Number(value);
  }
  return Number(value ?? 0);
};
```

**Impact:** Converting Decimal to Number may cause precision issues with XP calculations.

**Recommendation:** Keep calculations in Decimal until final rounding:

```typescript
import { Decimal } from '@prisma/client/runtime';

const xpEarned = baseXP.times(multiplier).toDecimalPlaces(0).toNumber();
```

#### Problem: No Data Retention Policy

**Location:** `prisma/schema.prisma` - `UserTaskAttempt`

**Impact:** Task attempt history grows indefinitely, potentially impacting query performance.

**Recommendation:** Implement data retention:

```typescript
// Archive or delete old attempts
const RETENTION_DAYS = 365;
await prisma.userTaskAttempt.deleteMany({
  where: {
    completedAt: {
      lt: new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000),
    },
  },
});
```

---

## Summary

This architecture ensures a robust, scalable task execution system with:

- **Proper XP tracking** with anti-grind mechanisms
- **Spaced repetition learning** support via SRS
- **Database consistency** through transactions
- **Authentication-aware** functionality
- **Comprehensive validation** and error handling
- **Modular component design** for maintainability

### Priority Improvements

| Priority     | Issue                             | Status     | Effort | Impact                   |
| ------------ | --------------------------------- | ---------- | ------ | ------------------------ |
| **Critical** | ~~Server-side answer validation~~ | ✅ Fixed   | Medium | High (Security)          |
| **Critical** | ~~Rate limiting on API~~          | ✅ Fixed   | Low    | High (Security)          |
| **Critical** | ~~Input sanitization~~            | ✅ Fixed   | Low    | High (Security)          |
| **High**     | ~~N+1 query fix~~                 | ✅ Fixed   | Low    | High (Performance)       |
| **High**     | ~~Type assertion fixes~~          | ✅ Fixed   | Medium | Medium (Maintainability) |
| **High**     | ~~Magic numbers~~                 | ✅ Fixed   | Low    | Medium (Maintainability) |
| **Medium**   | ~~Duplicated date logic~~         | ✅ Fixed   | Low    | Medium (Maintainability) |
| **Medium**   | ~~Large component files~~         | ✅ Fixed   | Low    | Medium (Maintainability) |
| **Medium**   | Add caching layer                 | ⏳ Pending | High   | High (Performance)       |
| **Medium**   | Offline support                   | ⏳ Pending | Medium | Medium (UX)              |
| **Low**      | Service decomposition             | ⏳ Pending | High   | Medium (Maintainability) |

---

## 12. Security Fixes Summary (Completed)

### Changes Implemented

#### 1. Created Server-Side Task Validator

**File:** `lib/tasks/taskValidator.ts` (new)

- `loadTaskById()` - Loads tasks from server-side storage
- `validateTaskAnswer()` - Validates all task types server-side
- `sanitizeUserAnswer()` - Sanitizes input before storage
- `getPublicTaskData()` - Strips answers for client-side use

#### 2. Updated API Route Security

**File:** `app/api/tasks/submit/route.ts`

- Removed trust in client-sent `isCorrect` flag
- Added server-side answer validation
- Implemented rate limiting (10 req/min per user)
- Added input sanitization
- Added task existence validation

#### 3. Updated Validation Schema

**File:** `lib/validation/schemas.ts`

- Removed `isCorrect` from `TaskSubmissionSchema`
- Added security documentation comments

#### 4. Updated Frontend

**File:** `components/tasks/hooks/useTaskSubmission.ts`

- Removed `isCorrect` from API request
- Added explanatory comments

#### 5. Updated Types

**File:** `types/xp.ts`

- Removed `isCorrect` from `TaskSubmissionRequest`
- Added documentation

### Security Improvements

| Issue              | Before                    | After                       |
| ------------------ | ------------------------- | --------------------------- |
| Answer validation  | Client-side (exploitable) | Server-side only            |
| isCorrect flag     | Trusted from client       | Ignored, server-calculated  |
| Rate limiting      | None                      | 10 req/min per user         |
| Input sanitization | Basic string conversion   | XSS filtering + length caps |
| Task lookup        | None (blind trust)        | Server-side validation      |

### Next Recommended Security Improvements

1. **Redis-based rate limiting** - For distributed deployments
2. **CAPTCHA integration** - After repeated failed attempts
3. **Audit logging** - Track all XP-modifying operations
4. **Request signing** - Additional tamper protection
