import { EmptyState } from "../components/EmptyState";
import { JobCard } from "../components/JobCard";
import { useAuth } from "../context/AuthContext";
import { useSavedJobs } from "../hooks/useSavedJobs";

export function SavedJobs() {
  const { savedJobs, isSaved, toggleSaved } = useSavedJobs();
  const { user } = useAuth();

  return (
    <div className="relative space-y-6">
      <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 opacity-[0.14] blur-3xl dark:opacity-[0.22]" />

      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
          Saved jobs
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Postings you've starred{user ? ", synced to your account" : ", kept on this device"}.
          Click the star to remove one.
        </p>
      </header>

      {savedJobs.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          description="Star a job from search results or its detail page to keep it here."
        />
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2">
          {savedJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isSaved={isSaved(job.id)}
              onToggleSaved={toggleSaved}
            />
          ))}
        </div>
      )}
    </div>
  );
}
