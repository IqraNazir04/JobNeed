import { AnimatePresence, motion } from "framer-motion";
import { EmptyState } from "../components/EmptyState";
import { JobCard } from "../components/JobCard";
import { PageHeader } from "../components/PageHeader";
import { staggerContainer, staggerItem } from "../components/PageTransition";
import { useAuth } from "../context/AuthContext";
import { useSavedJobs } from "../hooks/useSavedJobs";

export function SavedJobs() {
  const { savedJobs, isSaved, toggleSaved } = useSavedJobs();
  const { user } = useAuth();

  return (
    <div className="relative space-y-6">
      <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 opacity-[0.14] blur-3xl dark:opacity-[0.22]" />

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
