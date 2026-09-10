import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getMyCV, InterviewPrepResponse, prepareInterview } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { SearchBar } from "../components/SearchBar";
import { useAuth } from "../context/AuthContext";

const CATEGORY_CLASS: Record<string, string> = {
  Behavioral: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300",
  Technical: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  "Role-specific": "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500";

export function InterviewPrep() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InterviewPrepResponse | null>(null);

  async function runPrepare(payload: { job_id?: string; query?: string; job_description?: string }) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const cv = user ? await getMyCV().catch(() => undefined) : undefined;
      setResult(await prepareInterview({ ...payload, cv }));
    } catch (e) {
      setError(
        e instanceof Error && e.message.includes("404")
          ? "Couldn't find a matching indexed job. Try pasting the job description instead."
          : "Couldn't generate interview prep right now."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const jobId = searchParams.get("job_id");
    if (jobId) runPrepare({ job_id: jobId });
    // Only react to the initial deep link, not every keystroke elsewhere on the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
          Interview Prep
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Search a role from what JobNeed has indexed, or paste a job description, to get likely
          questions and talking points{user ? " tailored to your CV" : ""}.
        </p>
      </header>

      <SearchBar
        onSearch={(q) => runPrepare({ query: q })}
        placeholder="e.g. senior backend engineer"
        submitLabel="Find & prepare"
      />

      <div className="space-y-2.5 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="font-bold text-gray-900 dark:text-gray-50">Or paste a job description</h2>
        <textarea
          rows={4}
          className={inputClass}
          placeholder="Paste the job description here"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
        <button
          onClick={() => runPrepare({ job_description: jobDescription })}
          disabled={!jobDescription.trim() || loading}
          className="rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-indigo-600/25 transition-transform hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Prepare
        </button>
      </div>

      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Preparing…</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {result && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">
              {result.job_title}
              {result.company && ` · ${result.company}`}
            </h2>
            <p className="mt-1.5 text-sm text-gray-700 dark:text-gray-300">{result.role_summary}</p>
          </div>

          <div className="space-y-3">
            {result.questions.map((q, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-gray-900 dark:text-gray-50">{q.question}</p>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      CATEGORY_CLASS[q.category] ??
                      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {q.category}
                  </span>
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-gray-700 dark:text-gray-300">
                  {q.talking_points.map((tp, j) => (
                    <li key={j}>{tp}</li>
                  ))}
                </ul>
                <Link
                  to={`/speaking?q=${encodeURIComponent(q.question)}`}
                  className="mt-2 inline-block text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Practice answering this out loud →
                </Link>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="font-bold text-gray-900 dark:text-gray-50">Before you go in</h2>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-gray-700 dark:text-gray-300">
              {result.research_tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <EmptyState
          title="Ready when you are"
          description="Search a role or paste a job description to get started."
        />
      )}
    </div>
  );
}
