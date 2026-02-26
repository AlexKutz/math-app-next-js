'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';
import { CommentSkeleton } from './CommentSkeleton';
import { LoginButton } from '@/components/auth/LoginButton';

interface Comment {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userImage: string | null;
  likes: number;
  createdAt: Date;
  parentId: string | null;
  depth: number;
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
  
  // State for tracking liked comments
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const [likesInitialized, setLikesInitialized] = useState(false);
  
  // Optimistic update tracking
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, { likes: number; currentUserLiked: boolean; timestamp: number }>>({});
  
  // State for tracking which comments are currently processing a like request
  const [processingLikes, setProcessingLikes] = useState<Record<string, boolean>>({});

  // Helper function to count all comments including replies
  const getTotalCommentCount = (comments: Comment[]): number => {
    return comments.length; // Count all comments (top-level + replies)
  };

  // Load liked comments from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLikes = localStorage.getItem('commentLikes');
      if (savedLikes) {
        try {
          const parsedLikes = JSON.parse(savedLikes);
          console.log('Loaded liked comments from localStorage:', parsedLikes);
          setLikedComments(parsedLikes);
        } catch (e) {
          console.error('Failed to parse saved likes:', e);
        }
      }
      setLikesInitialized(true);
    }
  }, []);

  // Save liked comments to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && likesInitialized && Object.keys(likedComments).length > 0) {
      console.log('Saving liked comments to localStorage:', likedComments);
      localStorage.setItem('commentLikes', JSON.stringify(likedComments));
    }
  }, [likedComments, likesInitialized]);

  // Cleanup old optimistic updates (older than 30 seconds)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const tenMinutes = 10 * 60 * 1000;
      
      setOptimisticUpdates(prev => {
        const cleaned = { ...prev };
        let hasChanges = false;
        
        Object.keys(cleaned).forEach(commentId => {
          if (now - cleaned[commentId].timestamp > tenMinutes) {
            delete cleaned[commentId];
            hasChanges = true;
          }
        });
        
        return hasChanges ? cleaned : prev;
      });
    }, 60000); // Check every minute
    
    return () => clearInterval(cleanupInterval);
  }, []);

  // Fetch comments
  useEffect(() => {
    fetchComments();
  }, [subject, topic, likesInitialized, page]); // Add page to dependency array if using pagination

  const fetchComments = async () => {
    // Wait for likes to be initialized before fetching comments
    if (!likesInitialized) {
      console.log('Waiting for likes to initialize...');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/comments/subjects/${subject}/${topic}?page=${page}&limit=20`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      
      const data = await response.json();

      console.log('Fetched comments:', data)
      
      // Transform comments to include currentUserLiked from localStorage
      const transformedComments = data.comments.map((comment: any) => ({
        ...comment,
        userName: comment.userName || comment.user?.name || 'Анонімний користувач',
        userImage: comment.userImage !== undefined ? comment.userImage : comment.user?.image || null,
        currentUserLiked: !!likedComments[comment.id],
        depth: comment.depth !== undefined ? comment.depth : (comment.parentId ? 1 : 0),
      }));
      
      console.log('Transformed comments with like state:', transformedComments);
      
      // Debug: Log the nested reply structure
      transformedComments.forEach((comment: any) => {
        console.log(`Comment ${comment.id} has ${comment.replies.length} direct replies`);
        comment.replies.forEach((reply: any) => {
          console.log(`  Reply ${reply.id} has ${reply.replies?.length || 0} nested replies`);
        });
      });
      
      setComments(prev => page === 1 ? transformedComments : [...prev, ...transformedComments]);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (content: string, parentId?: string) => {
    console.log('Submitting comment:', { content, parentId });
    
    try {
      const response = await fetch(`/api/comments/subjects/${subject}/${topic}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, parentId }),
      });

      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData.error || 'Failed to submit comment');
      }

      const newComment = await response.json();
      console.log('New comment created:', newComment);
      
      // Add the new comment to the state (works for both top-level and replies)
      console.log('Adding new comment to state');
      setComments(prev => {
        // For replies, we need to calculate the correct depth
        const parentComment = parentId ? prev.find(c => c.id === parentId) : null;
        const commentWithDepth = {
          ...newComment,
          depth: parentId && parentComment ? parentComment.depth + 1 : 0
        };
        
        // Add to the beginning of the array to maintain chronological order
        const updatedComments = [commentWithDepth, ...prev];
        console.log('Updated comments array with new comment');
        return updatedComments;
      });
      
    } catch (err) {
      console.error('Error in handleSubmitComment:', err);
      alert(err instanceof Error ? err.message : 'Failed to submit comment');
    }
  };

  const handleLikeComment = async (commentId: string, optimisticUpdate: boolean = false) => {
    // Check if we are already processing a like for this comment to prevent spam
    if (processingLikes[commentId]) {
      return;
    }

    if (!session?.user?.id) {
      alert('Будь ласка, увійдіть, щоб поставити лайк');
      return;
    }

    const currentLiked = likedComments[commentId] || false;
    const action = currentLiked ? 'unlike' : 'like';

    console.log(`Processing ${action} for comment ${commentId}`, { optimisticUpdate });

    // Lock the button
    setProcessingLikes(prev => ({ ...prev, [commentId]: true }));

    // Store original state for potential rollback
    const originalComment = comments.find(c => c.id === commentId);
    
    if (!originalComment) {
      setProcessingLikes(prev => ({ ...prev, [commentId]: false }));
      return;
    }

    // Apply optimistic update immediately if requested
    if (optimisticUpdate) {
      const newLikedState = action === 'like';
      const likeDelta = action === 'like' ? 1 : -1;
      
      // Store optimistic update for potential rollback
      setOptimisticUpdates(prev => ({
        ...prev,
        [commentId]: {
          likes: originalComment.likes,
          currentUserLiked: originalComment.currentUserLiked,
          timestamp: Date.now()
        }
      }));

      // Update UI immediately
      setComments(prevComments => {
        return prevComments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              likes: Math.max(0, comment.likes + likeDelta),
              currentUserLiked: newLikedState
            };
          }
          return comment;
        });
      });

      // Update local storage tracking state
      setLikedComments(prev => ({
        ...prev,
        [commentId]: newLikedState
      }));
    }

    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to like comment');
      }

      const result = await response.json();
      
      console.log(`API response for comment ${commentId}:`, result);

      // Update local storage tracking state
      setLikedComments(prev => ({
        ...prev,
        [commentId]: action === 'like'
      }));

      // Update comments with the exact like count from API
      setComments(prevComments => {
        return prevComments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              likes: result.likes,
              currentUserLiked: action === 'like'
            };
          }
          return comment;
        });
      });

      // Clear optimistic update record since it was successful
      setOptimisticUpdates(prev => {
        const newUpdates = { ...prev };
        delete newUpdates[commentId];
        return newUpdates;
      });
      
    } catch (err) {
      console.error('Error processing like:', err);
      
      // Rollback optimistic update on error
      if (optimisticUpdate && originalComment) {
        const rollbackState = optimisticUpdates[commentId];
        if (rollbackState) {
          setComments(prevComments => {
            return prevComments.map(comment => {
              if (comment.id === commentId) {
                return {
                  ...comment,
                  likes: rollbackState.likes,
                  currentUserLiked: rollbackState.currentUserLiked
                };
              }
              return comment;
            });
          });

          // Restore local storage state
          setLikedComments(prev => ({
            ...prev,
            [commentId]: rollbackState.currentUserLiked
          }));

          // Clear the optimistic update record
          setOptimisticUpdates(prev => {
            const newUpdates = { ...prev };
            delete newUpdates[commentId];
            return newUpdates;
          });
        }
      }
      
      alert(err instanceof Error ? err.message : 'Failed to like comment');
    } finally {
      // Unlock the button
      setProcessingLikes(prev => ({ ...prev, [commentId]: false }));
    }
  };

  if (isLoading && comments.length === 0) {
    return <CommentSkeleton />;
  }

  return (
    <div className="mt-16 border-t border-border pt-8">
      <h2 className="text-2xl font-bold mb-6">Коментарі ({getTotalCommentCount(comments)})</h2>
      
      {session ? (
        <CommentForm onSubmit={handleSubmitComment} />
      ) : (
        <div className="bg-muted/50 rounded-lg p-6 text-center mb-8">
          <p className="text-muted-foreground mb-4">
            Увійдіть, щоб залишити коментар
          </p>
          <LoginButton />
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
          <p className="text-destructive">Помилка: {error}</p>
        </div>
      )}

      <CommentList 
        comments={comments} 
        onReply={handleSubmitComment}
        onLike={handleLikeComment}
        currentUserId={session?.user?.id}
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