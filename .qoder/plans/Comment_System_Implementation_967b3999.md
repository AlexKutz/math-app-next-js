# Comment System Implementation Plan

## 1. Database Schema Design

### New Model: Comment
Add to `prisma/schema.prisma`:

```prisma
model Comment {
  id          String    @id @default(uuid()) @db.Uuid
  userId      String    @map("user_id") @db.Uuid
  subject     String    @db.VarChar(50) // math, algebra, geometry, physics
  topicSlug   String    @map("topic_slug") @db.VarChar(255) // lesson folder name
  content     String    @db.Text
  parentId    String?   @map("parent_id") @db.Uuid // for replies
  likes       Int       @default(0)
  isApproved  Boolean   @default(true) @map("is_approved")
  isDeleted   Boolean   @default(false) @map("is_deleted")
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  user     User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent   Comment? @relation("CommentReplies", fields: [parentId], references: [id], onDelete: NoAction)
  replies  Comment[] @relation("CommentReplies")

  @@index([subject, topicSlug], map: "idx_comments_subject_topic")
  @@index([userId], map: "idx_comments_user")
  @@index([createdAt], map: "idx_comments_created_at")
  @@index([isApproved], map: "idx_comments_approved")
  @@map("comments")
}
```

### Migration Command
```bash
bunx prisma migrate dev --name add_comments_table
```

## 2. API Endpoints

### Create API Routes in `app/api/comments/`

#### GET `/api/comments/[subject]/[topic]`
Fetch comments for a specific lesson:
```typescript
// File: app/api/comments/[subject]/[topic]/route.ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ subject: string; topic: string }> }
) {
  const { subject, topic } = await params;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const sortBy = searchParams.get('sortBy') || 'createdAt'; // createdAt, likes
  
  // Fetch comments with pagination and sorting
  // Include user data (name, image)
  // Filter by approved status
}
```

#### POST `/api/comments/[subject]/[topic]`
Create new comment:
```typescript
// File: app/api/comments/[subject]/[topic]/route.ts
export async function POST(
  request: Request,
  { params }: { params: Promise<{ subject: string; topic: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { subject, topic } = await params;
  const { content, parentId } = await request.json();

  // Validate content length (e.g., 1-1000 characters)
  // Check if user can comment (spam protection)
  // Create comment with isApproved based on moderation settings
}
```

#### PATCH `/api/comments/[id]`
Update comment:
```typescript
// File: app/api/comments/[id]/route.ts
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;
  const { content } = await request.json();

  // Verify ownership or admin role
  // Update content and updatedAt
}
```

#### DELETE `/api/comments/[id]`
Delete comment:
```typescript
// File: app/api/comments/[id]/route.ts
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  // Verify ownership or admin role
  // Soft delete (set isDeleted = true)
}
```

#### POST `/api/comments/[id]/like`
Like/unlike comment:
```typescript
// File: app/api/comments/[id]/like/route.ts
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;
  const { action } = await request.json(); // 'like' or 'unlike'

  // Toggle like count
  // Prevent duplicate likes from same user (consider separate Like table for production)
}
```

## 3. Frontend Component Integration

### Create Comments Component
File: `components/comments/CommentsSection.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';
import { CommentSkeleton } from './CommentSkeleton';

interface Comment {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userImage: string | null;
  likes: number;
  createdAt: Date;
  replies: Comment[];
  currentUserLiked: boolean;
}

interface CommentsSectionProps {
  subject: string;
  topic: string;
}

export function CommentsSection({ subject, topic }: CommentsSectionProps) {
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch comments
  useEffect(() => {
    fetchComments();
  }, [subject, topic]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/comments/${subject}/${topic}?page=${page}&limit=20`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      
      const data = await response.json();
      setComments(prev => page === 1 ? data.comments : [...prev, ...data.comments]);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (content: string, parentId?: string) => {
    // Handle comment submission
  };

  if (isLoading && comments.length === 0) {
    return <CommentSkeleton />;
  }

  return (
    <div className="mt-16 border-t border-border pt-12">
      <h2 className="text-2xl font-bold mb-6">Коментарі ({comments.length})</h2>
      
      {session ? (
        <CommentForm onSubmit={handleSubmitComment} />
      ) : (
        <div className="bg-muted/50 rounded-lg p-6 text-center mb-8">
          <p className="text-muted-foreground mb-4">
            Увійдіть, щоб залишити коментар
          </p>
          {/* Login button component */}
        </div>
      )}

      <CommentList 
        comments={comments} 
        onReply={handleSubmitComment}
        onLike={handleLikeComment}
      />

      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={() => setPage(p => p + 1)}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Завантаження...' : 'Показати більше'}
          </button>
        </div>
      )}
    </div>
  );
}
```

### Comment Form Component
File: `components/comments/CommentForm.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const commentSchema = z.object({
  content: z.string().min(1, 'Коментар не може бути порожнім').max(1000, 'Коментар занадто довгий'),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface CommentFormProps {
  onSubmit: (content: string, parentId?: string) => Promise<void>;
  parentId?: string;
  onCancel?: () => void;
}

export function CommentForm({ onSubmit, parentId, onCancel }: CommentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  });

  const onSubmitForm = async (data: CommentFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data.content, parentId);
      reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="mb-8">
      <div className="space-y-3">
        <textarea
          {...register('content')}
          placeholder={parentId ? "Написати відповідь..." : "Написати коментар..."}
          className="w-full min-h-[120px] rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          disabled={isSubmitting}
        />
        {errors.content && (
          <p className="text-sm text-destructive">{errors.content.message}</p>
        )}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Публікація...' : parentId ? 'Відповісти' : 'Опублікувати'}
          </button>
          {parentId && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Скасувати
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
```

### Comment List Component
File: `components/comments/CommentList.tsx`

```typescript
import { CommentItem } from './CommentItem';

interface CommentListProps {
  comments: Comment[];
  onReply: (content: string, parentId: string) => Promise<void>;
  onLike: (commentId: string) => Promise<void>;
}

export function CommentList({ comments, onReply, onLike }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Поки немає коментарів. Будьте першим!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {comments.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onReply={onReply}
          onLike={onLike}
        />
      ))}
    </div>
  );
}
```

### Comment Item Component
File: `components/comments/CommentItem.tsx`

```typescript
'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import { CommentForm } from './CommentForm';
import { FaRegHeart, FaHeart, FaReply } from 'react-icons/fa';

interface CommentItemProps {
  comment: Comment;
  onReply: (content: string, parentId: string) => Promise<void>;
  onLike: (commentId: string) => Promise<void>;
}

export function CommentItem({ comment, onReply, onLike }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await onLike(comment.id);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors">
      <div className="flex gap-3">
        {/* User avatar */}
        <div className="flex-shrink-0">
          {comment.userImage ? (
            <img 
              src={comment.userImage} 
              alt={comment.userName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              {comment.userName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        {/* Comment content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-foreground">{comment.userName}</span>
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { 
                addSuffix: true, 
                locale: uk 
              })}
            </span>
          </div>
          
          <p className="text-foreground whitespace-pre-wrap mb-3">
            {comment.content}
          </p>
          
          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-1.5 text-sm ${
                comment.currentUserLiked 
                  ? 'text-red-500' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {comment.currentUserLiked ? <FaHeart /> : <FaRegHeart />}
              <span>{comment.likes}</span>
            </button>
            
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <FaReply />
              <span>Відповісти</span>
            </button>
          </div>
          
          {/* Reply form */}
          {showReplyForm && (
            <div className="mt-4 pl-4 border-l-2 border-border">
              <CommentForm 
                onSubmit={(content) => onReply(content, comment.id)}
                parentId={comment.id}
                onCancel={() => setShowReplyForm(false)}
              />
            </div>
          )}
          
          {/* Replies */}
          {comment.replies.length > 0 && (
            <div className="mt-4 pl-4 space-y-4">
              {comment.replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onLike={onLike}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

## 4. Integration with Lesson Pages

### Modify LessonRenderer.tsx
Add comments section to the lesson renderer:

```typescript
// In components/lesson/LessonRenderer.tsx
import { CommentsSection } from '@/components/comments/CommentsSection';

export function LessonRenderer({
  content,
  frontmatter,
  subject,
  topic,
}: LessonRendererProps) {
  // ... existing code ...

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />
      {isTableOfContentsRendered && <TableOfContents headings={headings} />}
      <div className={`mx-auto max-w-3xl xl:max-w-4xl relative pb-12 ${isTableOfContentsRendered ? 'lg:-translate-x-[calc((98vw-1536px)/4.6)]' : ''} 2xl:translate-x-0`}>
        <article className='prose prose-slate prose-lg max-w-none dark:prose-invert'>
          {/* ... existing article content ... */}
        </article>
        
        {/* Exercises button */}
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
      
      {/* Comments Section */}
      <div className="mx-auto max-w-3xl xl:max-w-4xl">
        <CommentsSection subject={subject} topic={topic} />
      </div>
    </>
  );
}
```

## 5. Authentication Integration

### Session Validation Utility
File: `lib/comments/auth.ts`

```typescript
import { auth } from '@/lib/auth/authConfig';

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function canModerate(session: any) {
  return session?.user?.role === 'ADMIN';
}
```

### Rate Limiting for Comments
File: `lib/comments/rate-limit.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const commentRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '10 m'), // 5 comments per 10 minutes
  analytics: true,
});
```

## 6. Moderation Features

### Admin Dashboard Component
File: `components/admin/CommentsModeration.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface PendingComment {
  id: string;
  content: string;
  userName: string;
  userEmail: string;
  createdAt: Date;
  subject: string;
  topicSlug: string;
}

export function CommentsModeration() {
  const { data: session } = useSession();
  const [pendingComments, setPendingComments] = useState<PendingComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchPendingComments();
    }
  }, [session]);

  const fetchPendingComments = async () => {
    const response = await fetch('/api/comments/pending');
    const data = await response.json();
    setPendingComments(data.comments);
    setIsLoading(false);
  };

  const handleApprove = async (commentId: string) => {
    await fetch(`/api/comments/${commentId}/approve`, { method: 'POST' });
    setPendingComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handleReject = async (commentId: string) => {
    await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
    setPendingComments(prev => prev.filter(c => c.id !== commentId));
  };

  if (session?.user?.role !== 'ADMIN') return null;

  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Коментарі на модерацію</h3>
      {isLoading ? (
        <p>Завантаження...</p>
      ) : pendingComments.length === 0 ? (
        <p>Немає коментарів на модерацію</p>
      ) : (
        <div className="space-y-4">
          {pendingComments.map(comment => (
            <div key={comment.id} className="border p-4 rounded">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium">{comment.userName}</p>
                  <p className="text-sm text-muted-foreground">{comment.userEmail}</p>
                  <p className="text-sm text-muted-foreground">
                    {comment.subject}/{comment.topicSlug}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.createdAt).toLocaleString('uk-UA')}
                </span>
              </div>
              <p className="mb-4">{comment.content}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(comment.id)}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                >
                  Схвалити
                </button>
                <button
                  onClick={() => handleReject(comment.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                >
                  Відхилити
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Spam Detection
File: `lib/comments/spam-filter.ts`

```typescript
const SPAM_KEYWORDS = [
  'viagra', 'casino', 'crypto', 'bitcoin', 'investment', 
  'loan', 'debt', 'credit', 'mortgage', 'insurance'
];

const LINK_REGEX = /https?:\/\/[^\s]+/gi;

export function detectSpam(content: string): boolean {
  const lowerContent = content.toLowerCase();
  
  // Check for spam keywords
  const hasSpamKeywords = SPAM_KEYWORDS.some(keyword => 
    lowerContent.includes(keyword)
  );
  
  // Check for excessive links
  const links = content.match(LINK_REGEX) || [];
  const hasTooManyLinks = links.length > 2;
  
  // Check for excessive caps
  const capsRatio = (content.match(/[A-Z]/g)?.length || 0) / content.length;
  const hasExcessiveCaps = capsRatio > 0.7 && content.length > 10;
  
  return hasSpamKeywords || hasTooManyLinks || hasExcessiveCaps;
}
```

## 7. UI/UX Considerations

### Responsive Design
- Comments section adapts to mobile screens
- Proper spacing and touch targets for mobile users
- Collapsible comment threads on smaller screens

### Loading States
- Skeleton loaders for initial comment loading
- Inline loading indicators for actions (like, reply)
- Smooth transitions between states

### Accessibility
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly structure
- Color contrast compliance

### Performance Optimizations

#### 1. Pagination Strategy
```typescript
// API endpoint supports cursor-based pagination
const COMMENTS_PER_PAGE = 20;

// Client-side infinite scroll with intersection observer
const useInfiniteComments = (subject: string, topic: string) => {
  // Implementation with automatic loading on scroll
};
```

#### 2. Caching Strategy
```typescript
// Cache comments for 5 minutes
export const { 
  handlers, 
  GET, 
  POST 
} = cacheControl({
  maxAge: 300, // 5 minutes
  staleWhileRevalidate: 60, // 1 minute
})(commentHandlers);
```

#### 3. Code Splitting
```typescript
// Lazy load comment components
import dynamic from 'next/dynamic';

const CommentsSection = dynamic(
  () => import('@/components/comments/CommentsSection'),
  { ssr: false, loading: () => <CommentSkeleton /> }
);
```

#### 4. Database Optimization
- Indexes on subject/topicSlug, userId, createdAt
- Efficient querying with Prisma includes/selects
- Consider read replicas for high-traffic lessons

## 8. Deployment Considerations

### Environment Variables Needed
```env
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
COMMENTS_MODERATION_ENABLED=true
COMMENTS_AUTO_APPROVE_TRUSTED_USERS=true
```

### Migration Steps
1. Run Prisma migration to add comments table
2. Deploy API endpoints
3. Add components to lesson pages
4. Test authentication integration
5. Configure rate limiting and spam filters
6. Set up admin moderation interface

## 9. Future Enhancements

### Advanced Features
- Comment reactions (👍, 😄, ❤️, etc.)
- Comment editing history
- User mentions (@username)
- Rich text formatting in comments
- Comment threading depth limits
- Email notifications for replies
- Comment reporting system
- User reputation system
- Comment search functionality

### Analytics
- Track comment engagement metrics
- Monitor spam detection effectiveness
- User participation statistics
- Popular discussion topics

This implementation provides a robust, scalable comment system that integrates seamlessly with the existing Next.js application architecture while maintaining performance and security standards.