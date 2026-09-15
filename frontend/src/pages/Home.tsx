import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { getGithubStats, getMyCV, search, SearchResult } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { JobCard } from "../components/JobCard";
import { JobCardSkeletonGrid } from "../components/JobCardSkeleton";
import { MotivationalQuote } from "../components/MotivationalQuote";
import { PageHeader } from "../components/PageHeader";
import { staggerContainer, staggerItem } from "../components/PageTransition";
import { SearchBar } from "../components/SearchBar";
import { SourceFilter } from "../components/SourceFilter";
import { useAuth } from "../context/AuthContext";
import { useSavedJobs } from "../context/SavedJobsContext";

const FEATURE_LINKS = [
  {
    to: "#assistant",
    label: "Ask the AI Assistant",
    className: "bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:hover:bg-sky-500/20",
  },
  {
    to: "#cv",
    label: "Tailor your CV",
    className: "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-500/10 dark:text-yellow-300 dark:hover:bg-yellow-500/20",
  },
  {
    to: "#interview",
    label: "Prepare for interviews",
    className: "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20",
  },
  {
    to: "#speaking",
    label: "Practice speaking",
    className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20",
  },
];

const KNOWN_SOURCES = [
  "greenhouse",
  "lever",
  "linkedin",
  "indeed",
  "google_jobs",
  "remoteok",
  "ashby",
  "jobicy",
];

type Status = "idle" | "loading" | "error" | "done";

export function Home() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [lastQuery, setLastQuery] = useState("");
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const { isSaved, toggleSaved } = useSavedJobs();
  const { user } = useAuth();

  const [personalize, setPersonalize] = useState(false);
  const [profileKeywords, setProfileKeywords] = useState<string[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (!personalize || !user) return;
    let cancelled = false;
    setLoadingProfile(true);
    (async () => {
      const keywords: string[] = [];
      try {
        const cv = await getMyCV();
        keywords.push(...cv.skills);
      } catch {
        // no CV saved yet — GitHub languages alone are still useful
      }
      if (user.github_username) {
        try {
          const stats = await getGithubStats(user.github_username);
          keywords.push(...stats.top_languages);
        } catch {
          // bad/unreachable GitHub username — fall back to CV skills only
        }
      }
      if (!cancelled) {
        setProfileKeywords(Array.from(new Set(keywords)));
        setLoadingProfile(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [personalize, user]);

  async function handleSearch(query: string) {
    setStatus("loading");
    setLastQuery(query);
    try {
      const effectiveQuery =
        personalize && profileKeywords.length > 0
          ? `${query} (relevant skills: ${profileKeywords.slice(0, 8).join(", ")})`
          : query;
      setResults(await search(effectiveQuery));
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  const sources = useMemo(
    () => Array.from(new Set([...KNOWN_SOURCES, ...results.map((r) => r.job.source)])),
    [results]
  );

  const remoteCount = useMemo(
    () => results.filter((r) => /remote/i.test(r.job.location)).length,
    [results]
  );

  const visibleResults = useMemo(() => {
    let list = activeSource ? results.filter((r) => r.job.source === activeSource) : results;
    if (remoteOnly) list = list.filter((r) => /remote/i.test(r.job.location));
    return list;
  }, [results, activeSource, remoteOnly]);

  return (
    <div className="relative isolate space-y-7">
      <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-96 w-96 rounded-full bg-gradient-to-br from-sky-400 to-yellow-400 opacity-[0.14] blur-3xl dark:opacity-[0.22]" />

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
        </div>
      </div>

      <SearchBar onSearch={handleSearch} />

      {user && (
        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            checked={personalize}
            onChange={(e) => setPersonalize(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500/40 dark:border-gray-700 dark:bg-gray-900"
          />
          Personalize with my profile
          {personalize && loadingProfile && <span className="text-xs text-gray-400">loading…</span>}
          {personalize && !loadingProfile && profileKeywords.length > 0 && (
            <span className="text-xs text-gray-400">
              (using {profileKeywords.slice(0, 4).join(", ")}
              {profileKeywords.length > 4 ? "…" : ""})
            </span>
          )}
          {personalize && !loadingProfile && profileKeywords.length === 0 && (
            <span className="text-xs text-gray-400">
              (add skills to your CV or GitHub to your profile first)
            </span>
          )}
        </label>
      )}

      <div className="space-y-2 rounded-2xl border border-gray-200 bg-white/60 p-4 dark:border-gray-800 dark:bg-gray-900/40">
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-600">
          Filters
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <SourceFilter sources={sources} active={activeSource} onChange={setActiveSource} />
          <button
            onClick={() => setRemoteOnly((v) => !v)}
            aria-pressed={remoteOnly}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              remoteOnly
                ? "bg-gradient-to-br from-sky-600 to-yellow-600 text-white shadow-sm shadow-sky-600/25"
                : "border border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600"
            }`}
          >
            Remote only{status === "done" && remoteCount > 0 ? ` (${remoteCount})` : ""}
          </button>
        </div>
      </div>

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
          {visibleResults.length === 0 && (
            <p className="py-4 text-sm text-gray-500 dark:text-gray-400">
              No results match this filter — try clearing it.
            </p>
          )}
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
        <div className="space-y-4">
          <EmptyState
            title="Search to get started"
            description='Try something like "remote React contract under 3 months".'
          />
          <MotivationalQuote className="mx-auto max-w-lg" />
        </div>
      )}

      <div className="space-y-3">
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">
          Beyond search
        </span>
        <h2 className="max-w-lg font-heading text-3xl font-bold leading-[1.1] text-gray-950 dark:text-gray-50 sm:text-4xl">
          The search is just the <span className="text-sky-600 dark:text-sky-400">start.</span>
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          Once you've found a role worth applying to, JobNeed helps you tailor your CV, prep for the
          interview, and practice how you'll answer out loud.
        </p>
        <div className="flex flex-wrap gap-2.5 pt-1">
          {FEATURE_LINKS.map((f) => (
            <a
              key={f.to}
              href={f.to}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${f.className}`}
            >
              {f.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
