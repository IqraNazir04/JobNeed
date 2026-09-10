import { useMemo, useState } from "react";
import { search, SearchResult } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { JobCard } from "../components/JobCard";
import { JobCardSkeletonGrid } from "../components/JobCardSkeleton";
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
    <div className="relative space-y-6">
      <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 opacity-[0.14] blur-3xl dark:opacity-[0.22]" />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <header className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
            Find your next role
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Search across every source JobNeed has indexed, ranked by relevance.
          </p>
        </header>
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=640&q=80"
          alt="A small team collaborating over laptops"
          className="hidden h-32 w-full rounded-2xl object-cover shadow-md shadow-gray-900/10 sm:block lg:h-28 lg:w-56 lg:shrink-0"
        />
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
          <div className="grid gap-3.5 sm:grid-cols-2">
            {visibleResults.map(({ job, score }) => (
              <JobCard
                key={job.id}
                job={job}
                score={score}
                isSaved={isSaved(job.id)}
                onToggleSaved={toggleSaved}
              />
            ))}
          </div>
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
