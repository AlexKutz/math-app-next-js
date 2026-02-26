import { CommentItem } from './CommentItem';

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

interface CommentListProps {
  comments: Comment[];
  onReply: (content: string, parentId: string) => Promise<void>;
  onLike: (commentId: string, optimisticUpdate: boolean) => void;
  currentUserId?: string;
}

export function CommentList({ comments, onReply, onLike, currentUserId }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Поки немає коментарів. Будьте першим!
      </div>
    );
  }

  // Group comments by parent-child relationships with multi-level nesting
  const groupComments = (allComments: Comment[]) => {
    // Create maps for quick lookup
    const commentMap = new Map<string, Comment>();
    const childrenMap = new Map<string, Comment[]>();
      
    // Populate maps
    allComments.forEach(comment => {
      commentMap.set(comment.id, comment);
      if (comment.parentId) {
        if (!childrenMap.has(comment.parentId)) {
          childrenMap.set(comment.parentId, []);
        }
        childrenMap.get(comment.parentId)?.push(comment);
      }
    });
      
    // Recursive function to build nested structure
    const buildNestedStructure = (comments: Comment[], currentDepth: number = 0): Array<{comment: Comment, children: Array<{comment: Comment, children: any[]}>}> => {
      return comments
        .filter(comment => comment.depth === currentDepth)
        .map(comment => {
          const directChildren = childrenMap.get(comment.id) || [];
          const nestedChildren = buildNestedStructure(directChildren, currentDepth + 1);
            
          return {
            comment,
            children: nestedChildren
          };
        })
        .sort((a, b) => new Date(b.comment.createdAt).getTime() - new Date(a.comment.createdAt).getTime());
    };
      
    // Start with top-level comments (depth 0)
    return buildNestedStructure(allComments, 0);
  };
  
  const groupedComments = groupComments(comments);
  
  // Recursive component to render nested comments
  const renderCommentTree = (node: {comment: Comment, children: Array<{comment: Comment, children: any[]}>}, level: number = 0) => {
    const isTopLevel = level === 0;
    const indentClass = level > 0 ? `ml-${Math.min(level * 4, 16)} border-l-2 border-border pl-4` : '';
      
    return (
      <div key={node.comment.id} className={isTopLevel ? '' : indentClass}>
        <CommentItem
          comment={{
            ...node.comment,
            depth: level
          }}
          onReply={onReply}
          onLike={onLike}
          currentUserId={currentUserId}
        />
          
        {/* Render children with increased nesting level */}
        {node.children.length > 0 && (
          <div className="mt-3 space-y-3">
            {node.children.map(child => renderCommentTree(child, level + 1))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      {groupedComments.map(node => renderCommentTree(node, 0))}
    </div>
  );
}