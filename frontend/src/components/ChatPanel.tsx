import { useState } from "react";
import { chat, Job } from "../api/client";
import { useSavedJobs } from "../hooks/useSavedJobs";
import { JobCard } from "./JobCard";
import { SearchBar } from "./SearchBar";

const SUGGESTED_PROMPTS = [
  "Remote React contract under 3 months",
  "Senior backend engineer in healthcare",
  "Product designer with growth experience",
];

export function ChatPanel() {
  const [answer, setAnswer] = useState<string | null>(null);
  const [matches, setMatches] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const { isSaved, toggleSaved } = useSavedJobs();

  async function handleAsk(message: string) {
    setLoading(true);
    setError(null);
    setLastPrompt(message);
    try {
      const res = await chat(message);
      setAnswer(res.answer);
      setMatches(res.matches);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <SearchBar
        onSearch={handleAsk}
        placeholder="e.g. remote React contract under 3 months"
        submitLabel="Ask"
      />

      <div className="flex flex-wrap gap-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleAsk(prompt)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              lastPrompt === prompt
                ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-600/25"
                : "border border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600"
            }`}
          >
            {prompt}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Thinking…</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {answer && (
        <div className="whitespace-pre-wrap rounded-2xl bg-gray-100 p-4 text-sm leading-relaxed text-gray-800 dark:bg-gray-800/60 dark:text-gray-200">
          {answer}
        </div>
      )}
      {matches.length > 0 && (
        <div className="grid gap-3.5 sm:grid-cols-2">
          {matches.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isSaved={isSaved(job.id)}
              onToggleSaved={toggleSaved}
            />
          ))}
        </div>
      )}
    </div>
  );
}
