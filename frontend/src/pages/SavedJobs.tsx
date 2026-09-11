import { AnimatePresence, motion } from "framer-motion";
import { EmptyState } from "../components/EmptyState";
import { JobCard } from "../components/JobCard";
import { PageHeader } from "../components/PageHeader";
import { staggerContainer, staggerItem } from "../components/PageTransition";
import { RotatingBadge } from "../components/RotatingBadge";
import { useAuth } from "../context/AuthContext";
import { useSavedJobs } from "../hooks/useSavedJobs";

export function SavedJobs() {
  const { savedJobs, isSaved, toggleSaved } = useSavedJobs();
  const { user } = useAuth();

  return (
    <div className="relative isolate space-y-6">
      <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 opacity-[0.14] blur-3xl dark:opacity-[0.22]" />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          kicker="Saved"
          title="Your saved"
          emphasis="jobs."
          subtitle={
            <>
              Postings you've starred{user ? ", synced to your account" : ", kept on this device"}.
              Click the star to remove one.
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

      {savedJobs.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          description="Star a job from search results or its detail page to keep it here."
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid gap-3.5 sm:grid-cols-2"
        >
          <AnimatePresence>
            {savedJobs.map((job) => (
              <motion.div
                key={job.id}
                variants={staggerItem}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                layout
              >
                <JobCard job={job} isSaved={isSaved(job.id)} onToggleSaved={toggleSaved} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
