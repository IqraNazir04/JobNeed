import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getMyCV, InterviewPrepResponse, prepareInterview } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { MotivationalQuote } from "../components/MotivationalQuote";
import { PageHeader } from "../components/PageHeader";
import { staggerContainer, staggerItem } from "../components/PageTransition";
import { SearchBar } from "../components/SearchBar";
import { useAuth } from "../context/AuthContext";

const CATEGORY_CLASS: Record<string, string> = {
  Behavioral: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300",
  Technical: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  "Role-specific": "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-sky-500/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500";

export function InterviewPrep({
  prefillJobId,
  onAskSpeaking,
}: {
  prefillJobId?: string | null;
  onAskSpeaking: (question: string) => void;
}) {
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
    if (prefillJobId) runPrepare({ job_id: prefillJobId });
    // Only react when a job is handed off from the search results, not every keystroke elsewhere on the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillJobId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          kicker="Interview Prep"
          title="Prepare with"
          emphasis="confidence."
          subtitle={
            <>
              Search a role from what JobNeed has indexed, or paste a job description, to get likely
              questions and talking points{user ? " tailored to your CV" : ""}.
            </>
          }
        />
        <div className="relative hidden shrink-0 sm:block">
          <motion.img
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80"
            alt="Two professionals in an interview-style conversation"
            className="h-44 w-full rounded-2xl object-cover shadow-lg shadow-gray-900/10 lg:h-40 lg:w-80"
          />
        </div>
      </div>

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
          className="rounded-xl bg-gradient-to-br from-sky-600 to-yellow-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-sky-600/25 transition-transform hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Prepare
        </button>
      </div>

      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Preparing…</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {result && (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4">
          <motion.div
            variants={staggerItem}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <h2 className="font-heading text-xl font-bold text-gray-950 dark:text-gray-50">
              {result.job_title}
              {result.company && <span className="text-gray-500 dark:text-gray-400"> · {result.company}</span>}
            </h2>
            <p className="mt-1.5 text-sm text-gray-700 dark:text-gray-300">{result.role_summary}</p>
          </motion.div>

          <div className="space-y-3">
            {result.questions.map((q, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-heading text-lg font-semibold leading-snug text-gray-900 dark:text-gray-50">
                    “{q.question}”
                  </p>
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
                <button
                  onClick={() => onAskSpeaking(q.question)}
                  className="mt-2 inline-block text-xs font-semibold text-sky-600 hover:underline dark:text-sky-400"
                >
                  Practice answering this out loud →
                </button>
              </motion.div>
            ))}
          </div>

          <motion.div
            variants={staggerItem}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <h2 className="font-bold text-gray-900 dark:text-gray-50">Before you go in</h2>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-gray-700 dark:text-gray-300">
              {result.research_tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}

      {!result && !loading && !error && (
        <div className="space-y-4">
          <EmptyState
            title="Ready when you are"
            description="Search a role or paste a job description to get started."
          />
          <MotivationalQuote className="mx-auto max-w-lg" />
        </div>
      )}
    </div>
  );
}
