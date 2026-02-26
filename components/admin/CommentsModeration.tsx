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
    if ((session?.user as any)?.role === 'ADMIN') {
      fetchPendingComments();
    }
  }, [session]);

  const fetchPendingComments = async () => {
    try {
      const response = await fetch('/api/comments/pending');
      if (!response.ok) throw new Error('Failed to fetch pending comments');
      const data = await response.json();
      setPendingComments(data.comments);
    } catch (error) {
      console.error('Error fetching pending comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/approve`, { 
        method: 'POST' 
      });
      if (!response.ok) throw new Error('Failed to approve comment');
      
      setPendingComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error approving comment:', error);
      alert('Failed to approve comment');
    }
  };

  const handleReject = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, { 
        method: 'DELETE' 
      });
      if (!response.ok) throw new Error('Failed to reject comment');
      
      setPendingComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error rejecting comment:', error);
      alert('Failed to reject comment');
    }
  };

  if ((session?.user as any)?.role !== 'ADMIN') return null;

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