import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Job } from "../api/client";
import { useSavedJobs } from "../context/SavedJobsContext";
import { ConfettiBurst } from "./ConfettiBurst";

export function JobDetailModal({
  job,
  onClose,
  onPrepareInterview,
}: {
  job: Job | null;
  onClose: () => void;
  onPrepareInterview: (jobId: string) => void;
}) {
  const { isSaved, toggleSaved } = useSavedJobs();
  const [burstKey, setBurstKey] = useState(0);

  useEffect(() => {
    if (!job) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [job, onClose]);

  return (
    <AnimatePresence>
      {job && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-gray-950/60 p-4 py-10 backdrop-blur-sm sm:py-16"
          onClick={onClose}
        >
          <motion.article
            role="dialog"
            aria-modal="true"
            aria-label={`${job.title} at ${job.company}`}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/20 dark:border-gray-800 dark:bg-gray-900"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm transition-colors hover:text-gray-900 dark:bg-gray-900/90 dark:text-gray-300 dark:hover:text-gray-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <img
              src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80"
              alt=""
              className="h-40 w-full object-cover sm:h-48"
            />
            <div className="max-h-[70vh] overflow-y-auto p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-heading text-3xl font-bold tracking-tight text-gray-950 dark:text-gray-50">
                    {job.title}
                  </h2>
                  <p className="mt-1.5 text-base text-gray-600 dark:text-gray-400">
                    {job.company} · {job.location}
                  </p>
                </div>
                <button
                  onClick={() => toggleSaved(job)}
                  className={`shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    isSaved(job.id)
                      ? "border-transparent bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={isSaved(job.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
                    <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 7.1-1.01L12 2z" />
                  </svg>
                  {isSaved(job.id) ? "Saved" : "Save"}
                </button>
              </div>

              <span className="mt-3.5 inline-block text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                {job.source}
              </span>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {job.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="relative inline-block">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setBurstKey((k) => k + 1)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-sky-600 to-yellow-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-600/25 transition-transform hover:brightness-110 active:scale-[0.98]"
                  >
                    View original posting
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <path d="M15 3h6v6" />
                      <path d="M10 14L21 3" />
                    </svg>
                  </a>
                  <ConfettiBurst burstKey={burstKey} />
                </span>
                <button
                  onClick={() => onPrepareInterview(job.id)}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:border-gray-300 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600"
                >
                  Prepare for this interview
                </button>
              </div>
            </div>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
