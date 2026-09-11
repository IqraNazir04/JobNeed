import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

const FEATURE_LINKS = [
  { to: "/assistant", label: "Ask the AI Assistant" },
  { to: "/cv", label: "Tailor your CV" },
  { to: "/interview", label: "Prepare for interviews" },
  { to: "/speaking", label: "Practice speaking" },
];

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
    <div className="relative isolate space-y-7">
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

      <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1700819000398-d1b72be76844?auto=format&fit=crop&w=1600&q=80)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/85 to-gray-950/50" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 sm:py-20">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
            Beyond search
          </span>
          <h2 className="mt-3 max-w-lg font-serif text-3xl font-bold leading-[1.1] text-white sm:text-4xl">
            The search is just the <em className="italic text-indigo-300">start.</em>
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-300">
            Once you've found a role worth applying to, JobNeed helps you tailor your CV, prep for the
            interview, and practice how you'll answer out loud.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {FEATURE_LINKS.map((f) => (
              <Link
                key={f.to}
                to={f.to}
                className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:border-white/40 hover:bg-white/10"
              >
                {f.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
