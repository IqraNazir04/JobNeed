import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ApplicationStatus } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { MotivationalQuote } from "../components/MotivationalQuote";
import { PageHeader } from "../components/PageHeader";
import { RotatingBadge } from "../components/RotatingBadge";
import { useAuth } from "../context/AuthContext";
import { useJobModal } from "../context/JobModalContext";
import { useSavedJobs } from "../hooks/useSavedJobs";

const COLUMNS: { key: ApplicationStatus; label: string; dot: string }[] = [
  { key: "saved", label: "Saved", dot: "bg-gray-400 dark:bg-gray-600" },
  { key: "applied", label: "Applied", dot: "bg-sky-500" },
  { key: "interviewing", label: "Interviewing", dot: "bg-amber-500" },
  { key: "offer", label: "Offer", dot: "bg-emerald-500" },
  { key: "rejected", label: "Rejected", dot: "bg-gray-300 dark:bg-gray-700" },
];

const selectClass =
  "w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-600 outline-none focus:border-transparent focus:ring-2 focus:ring-sky-500/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300";

export function SavedJobs() {
  const { savedJobs, toggleSaved, updateStatus } = useSavedJobs();
  const { user } = useAuth();
  const { openJob } = useJobModal();

  return (
    <div className="relative isolate space-y-6">
      <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-96 w-96 rounded-full bg-gradient-to-br from-sky-400 to-yellow-400 opacity-[0.14] blur-3xl dark:opacity-[0.22]" />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          kicker="Tracker"
          title="Your application"
          emphasis="pipeline."
          subtitle={
            <>
              Every job you've starred, tracked from saved to offer
              {user ? ", synced to your account" : ", kept on this device"}. Move a card's status as
              you progress.
            </>
          }
        />
        <div className="relative hidden shrink-0 sm:block">
          <motion.img
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            src="https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=800&q=80"
            alt="A professional typing on a laptop"
            className="h-44 w-full rounded-2xl object-cover shadow-lg shadow-gray-900/10 lg:h-40 lg:w-80"
          />
          <RotatingBadge className="absolute -bottom-6 -left-6 hidden lg:block" />
        </div>
      </div>

      <MotivationalQuote className="max-w-lg" />

      {savedJobs.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          description="Star a job from search results or its detail page to start your pipeline. Every application you send is a step forward, even the ones that don't land."
        />
      ) : (
        <LayoutGroup>
          <div className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
            {COLUMNS.map((col) => {
              const entries = savedJobs.filter((e) => e.status === col.key);
              return (
                <div key={col.key} className="w-72 shrink-0">
                  <div className="mb-2.5 flex items-center gap-2 px-1">
                    <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                    <span className="font-mono text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                      {col.label}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-600">{entries.length}</span>
                  </div>

                  <div className="space-y-2.5 rounded-2xl bg-gray-100/70 p-2.5 dark:bg-gray-900/40">
                    <AnimatePresence>
                      {entries.map(({ job }) => (
                        <motion.div
                          key={job.id}
                          layoutId={`tracker-${job.id}`}
                          layout
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ type: "spring", stiffness: 400, damping: 34 }}
                          className="space-y-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm shadow-gray-900/[0.03] dark:border-gray-800 dark:bg-gray-950"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => openJob(job)}
                              className="text-left font-heading text-sm font-bold leading-snug text-gray-950 hover:text-sky-600 dark:text-gray-50 dark:hover:text-sky-400"
                            >
                              {job.title}
                            </button>
                            <button
                              onClick={() => toggleSaved(job)}
                              aria-label="Remove from tracker"
                              className="shrink-0 text-gray-300 transition-colors hover:text-red-500 dark:text-gray-700 dark:hover:text-red-400"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {job.company} · {job.location}
                          </p>
                          <select
                            value={col.key}
                            onChange={(e) => updateStatus(job.id, e.target.value as ApplicationStatus)}
                            className={selectClass}
                          >
                            {COLUMNS.map((c) => (
                              <option key={c.key} value={c.key}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {entries.length === 0 && (
                      <p className="px-1 py-6 text-center text-xs text-gray-400 dark:text-gray-600">
                        No jobs here yet
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </LayoutGroup>
      )}
    </div>
  );
}
