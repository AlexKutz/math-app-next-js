'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import { CommentForm } from './CommentForm';
import { FaRegHeart, FaHeart, FaReply } from 'react-icons/fa';

interface Comment {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userImage: string | null;
  likes: number;
  createdAt: Date;
  parentId: string | null;
  depth: number; // 0 for top-level, 1 for replies
  currentUserLiked: boolean;
}

interface CommentItemProps {
  comment: Comment;
  onReply: (content: string, parentId: string) => Promise<void>;
  onLike: (commentId: string, optimisticUpdate: boolean) => void;
  currentUserId?: string;
}

export function CommentItem({ comment, onReply, onLike, currentUserId }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const isOwnComment = currentUserId && comment.userId === currentUserId;

  const handleLike = () => {
    if (isLiking || isOwnComment) return;
    setIsLiking(true);
    try {
      onLike(comment.id, true); // Pass true for optimistic update
    } finally {
      // Reset loading state after a short delay to give visual feedback
      setTimeout(() => setIsLiking(false), 300);
    }
  };

  return (
    <div className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors">
      <div className="flex gap-3">
        {/* User avatar */}
        <div className="shrink-0">
          {comment.userImage ? (
            <img 
              src={comment.userImage} 
              alt={comment.userName || 'Анонімний користувач'}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              {(comment.userName || 'А')[0].toUpperCase()}
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
            {comment.depth > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                Debug {' '}
                {comment.depth > 1 && `(${comment.depth}-й рівень)`}
              </span>
            )}
          </div>
          
          <p className="text-foreground whitespace-pre-wrap mb-3">
            {comment.content}
          </p>
          
          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              disabled={isLiking || !!isOwnComment}
              className={`flex items-center gap-1.5 text-sm w-8 ${
                comment.currentUserLiked 
                  ? 'text-red-500 cursor-pointer' 
                  : isOwnComment
                    ? 'text-muted-foreground cursor-default'
                    : 'text-muted-foreground hover:text-foreground cursor-pointer'
              }`}
              title={isOwnComment ? "Ви не можете лайкати власний коментар" : "Лайкнути коментар"}
            >
              {comment.currentUserLiked ? <FaHeart /> : <FaRegHeart />}
              <span>{comment.likes}</span>
            </button>
            
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <FaReply />
              <span>Відповісти</span>
            </button>
          </div>
          
          {/* Reply form */}
          {showReplyForm && (
            <div className="mt-4">
              <CommentForm 
                onSubmit={async (content) => {
                  try {
                    await onReply(content, comment.id);
                    setShowReplyForm(false);
                  } catch (error) {
                    console.error('Error submitting reply:', error);
                    // Don't hide the form on error so user can retry
                  }
                }}
                parentId={comment.id}
                onCancel={() => setShowReplyForm(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}