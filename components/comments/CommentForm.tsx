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
    } catch (error) {
      console.error('Error submitting comment:', error);
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
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Публікація...' : parentId ? 'Відповісти' : 'Коментувати'}
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