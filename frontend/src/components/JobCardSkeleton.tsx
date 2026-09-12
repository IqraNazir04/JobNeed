const shimmer =
  "animate-shimmer bg-[length:150%_100%] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700/70 dark:to-gray-800";

export function JobCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`h-4 w-3/5 rounded ${shimmer}`} style={{ animationDelay: `${delay}ms` }} />
        <div className={`h-4 w-4 shrink-0 rounded-full ${shimmer}`} style={{ animationDelay: `${delay}ms` }} />
      </div>
      <div className={`mt-2.5 h-4 w-24 rounded-full ${shimmer}`} style={{ animationDelay: `${delay}ms` }} />
      <div className={`mt-2.5 h-3 w-1/3 rounded ${shimmer}`} style={{ animationDelay: `${delay}ms` }} />
      <div className={`mt-3 h-3 w-full rounded ${shimmer}`} style={{ animationDelay: `${delay}ms` }} />
      <div className={`mt-1.5 h-3 w-5/6 rounded ${shimmer}`} style={{ animationDelay: `${delay}ms` }} />
      <div className={`mt-2.5 h-3 w-16 rounded ${shimmer}`} style={{ animationDelay: `${delay}ms` }} />
    </div>
  );
}

export function JobCardSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <JobCardSkeleton key={i} delay={i * 90} />
      ))}
    </div>
  );
}
