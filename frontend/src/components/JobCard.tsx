import type { Job } from "../api/client";
import { useJobModal } from "../context/JobModalContext";

export function JobCard({
  job,
  score,
  isSaved,
  onToggleSaved,
}: {
  job: Job;
  score?: number;
  isSaved?: boolean;
  onToggleSaved?: (job: Job) => void;
}) {
  const { openJob } = useJobModal();

  return (
    <div className="group relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm shadow-gray-900/[0.03] transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-600/10 dark:border-gray-800 dark:bg-gray-900 dark:shadow-none dark:hover:border-sky-500/40">
      {onToggleSaved && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleSaved(job);
          }}
          aria-label={isSaved ? "Remove from saved" : "Save job"}
          aria-pressed={isSaved}
          className={`absolute right-3.5 top-3.5 transition-transform hover:scale-110 ${
            isSaved ? "text-sky-600 dark:text-sky-400" : "text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400"
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
            <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 7.1-1.01L12 2z" />
          </svg>
        </button>
      )}
      <button type="button" onClick={() => openJob(job)} className="block w-full pr-7 text-left">
        <h3 className="font-heading text-lg font-bold leading-snug tracking-tight text-gray-950 dark:text-gray-50">
          {job.title}
        </h3>
        {score !== undefined && (
          <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-600 dark:bg-sky-400" />
            {(score * 100).toFixed(0)}% match
          </div>
        )}
        <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">
          {job.company} · {job.location}
        </p>
        <p className="mt-2 line-clamp-3 text-sm text-gray-700 dark:text-gray-300">{job.description}</p>
        <span className="mt-2.5 inline-block text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          {job.source}
        </span>
      </button>
    </div>
  );
}
