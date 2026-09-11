import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { search, SearchResult } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { JobCard } from "../components/JobCard";
import { JobCardSkeletonGrid } from "../components/JobCardSkeleton";
import { PageHeader } from "../components/PageHeader";
import { staggerContainer, staggerItem } from "../components/PageTransition";
import { RotatingBadge } from "../components/RotatingBadge";
import { SearchBar } from "../components/SearchBar";
import { SourceFilter } from "../components/SourceFilter";
import { useSavedJobs } from "../hooks/useSavedJobs";

type Status = "idle" | "loading" | "error" | "done";

export function Home() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [lastQuery, setLastQuery] = useState("");
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const { isSaved, toggleSaved } = useSavedJobs();

  async function handleSearch(query: string) {
    setStatus("loading");
    setLastQuery(query);
    setActiveSource(null);
    try {
      setResults(await search(query));
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  const sources = useMemo(
    () => Array.from(new Set(results.map((r) => r.job.source))),
    [results]
  );

  const visibleResults = useMemo(
    () =>
      activeSource ? results.filter((r) => r.job.source === activeSource) : results,
    [results, activeSource]
  );

  return (
    <div className="relative space-y-7">
      <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 opacity-[0.14] blur-3xl dark:opacity-[0.22]" />
      <span
        aria-hidden
        className="pointer-events-none absolute -left-6 -top-16 -z-10 select-none font-serif text-[11rem] italic leading-none text-gray-900/[0.04] dark:text-gray-100/[0.04]"
      >
        “
      </span>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          kicker="Search"
          title="Find your next"
          emphasis="role."
          subtitle="Search across every source JobNeed has indexed, ranked by relevance."
        />
        <div className="relative hidden shrink-0 sm:block">
          <motion.img
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80"
            alt="A small team collaborating over laptops"
            className="h-44 w-full rounded-2xl object-cover shadow-lg shadow-gray-900/10 lg:h-40 lg:w-80"
          />
          <RotatingBadge className="absolute -bottom-6 -left-6 hidden lg:block" />
        </div>
      </div>

      <SearchBar onSearch={handleSearch} />

      {status === "loading" && <JobCardSkeletonGrid />}

      {status === "error" && (
        <EmptyState
          title="Something went wrong"
          description="Couldn't reach the search API. Check that the backend is running."
        />
      )}

      {status === "done" && results.length === 0 && (
        <EmptyState
          title={`No matches for "${lastQuery}"`}
          description="Try a broader query, or ingest more postings first."
        />
      )}

      {status === "done" && results.length > 0 && (
        <div className="space-y-3">
          <SourceFilter sources={sources} active={activeSource} onChange={setActiveSource} />
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid gap-3.5 sm:grid-cols-2"
          >
            {visibleResults.map(({ job, score }) => (
              <motion.div key={job.id} variants={staggerItem}>
                <JobCard job={job} score={score} isSaved={isSaved(job.id)} onToggleSaved={toggleSaved} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {status === "idle" && (
        <EmptyState
          title="Search to get started"
          description='Try something like "remote React contract under 3 months".'
        />
      )}
    </div>
  );
}
