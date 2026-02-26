export function CommentSkeleton() {
  return (
    <div className="mt-16 border-t border-border pt-12">
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-48 mb-6"></div>
        
        {/* Comment form skeleton */}
        <div className="mb-8">
          <div className="h-32 bg-muted rounded-lg mb-3"></div>
          <div className="h-10 bg-muted rounded-lg w-32"></div>
        </div>
        
        {/* Comments list skeleton */}
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-border rounded-lg p-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-muted"></div>
                </div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-full mb-1"></div>
                  <div className="h-4 bg-muted rounded w-4/5 mb-3"></div>
                  <div className="flex gap-4">
                    <div className="h-4 bg-muted rounded w-12"></div>
                    <div className="h-4 bg-muted rounded w-20"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}