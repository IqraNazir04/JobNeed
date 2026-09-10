import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getJob, Job } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { useSavedJobs } from "../hooks/useSavedJobs";

type Status = "loading" | "error" | "not-found" | "done";

function JobDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-800" />
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
        <div className="h-40 w-full bg-gray-200 sm:h-48 dark:bg-gray-800" />
        <div className="space-y-3 p-7">
          <div className="h-6 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-3 w-5/6 rounded bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    </div>
  );
}

export function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const { isSaved, toggleSaved } = useSavedJobs();

  useEffect(() => {
    if (!id) return;
    setStatus("loading");
    getJob(id)
      .then((j) => {
        setJob(j);
        setStatus("done");
      })
      .catch((e) => {
        setStatus(e instanceof Error && e.message.includes("404") ? "not-found" : "error");
      });
  }, [id]);

  if (status === "loading") {
    return <JobDetailSkeleton />;
  }

  if (status === "not-found") {
    return (
      <EmptyState title="Job not found" description="It may have been removed." />
    );
  }

  if (status === "error" || !job) {
    return (
      <EmptyState
        title="Couldn't load this job"
        description="Check that the backend is running and try again."
      />
    );
  }

  const saved = isSaved(job.id);

  return (
    <article className="space-y-4">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 transition-transform hover:-translate-x-0.5 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back to search
      </Link>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-900/[0.03] dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
        <img
          src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80"
          alt=""
          className="h-40 w-full object-cover sm:h-48"
        />
        <div className="p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
                {job.title}
              </h1>
              <p className="mt-1.5 text-base text-gray-600 dark:text-gray-400">
                {job.company} · {job.location}
              </p>
            </div>
            <button
              onClick={() => toggleSaved(job)}
              className={`shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                saved
                  ? "border-transparent bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
                <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 7.1-1.01L12 2z" />
              </svg>
              {saved ? "Saved" : "Save"}
            </button>
          </div>

          <span className="mt-3.5 inline-block text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            {job.source}
          </span>

          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            {job.description}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/25 transition-transform hover:brightness-110"
            >
              View original posting
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <path d="M15 3h6v6" />
                <path d="M10 14L21 3" />
              </svg>
            </a>
            <Link
              to={`/interview?job_id=${encodeURIComponent(job.id)}`}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:border-gray-300 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600"
            >
              Prepare for this interview
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
