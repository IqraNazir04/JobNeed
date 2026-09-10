export function JobCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
      <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
      <div className="mt-2 h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
      <div className="mt-3 h-3 w-full rounded bg-gray-200 dark:bg-gray-800" />
      <div className="mt-1.5 h-3 w-5/6 rounded bg-gray-200 dark:bg-gray-800" />
    </div>
  );
}

export function JobCardSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  );
}
