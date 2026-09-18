import { FormEvent, useEffect, useState } from "react";
import { adminLogin, adminLoginTotp, closeBoardJob, createBoardJob, getMyBoardJobs, Job, updateBoardJob } from "../api/client";
import { useToast } from "../context/ToastContext";
import { isAuthError } from "../hooks/useAdminSession";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-sky-500/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500";
const labelClass = "text-xs font-semibold text-gray-500 dark:text-gray-400";

const EMPTY_BOARD_FORM = {
  title: "",
  company: "",
  location: "",
  remote: false,
  salaryRange: "",
  description: "",
  url: "",
};

export function AdminLoginForm({ onLoggedIn }: { onLoggedIn: (token: string, email: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (pendingToken) {
        const res = await adminLoginTotp(pendingToken, code.trim());
        onLoggedIn(res.access_token!, res.email!);
      } else {
        const res = await adminLogin(email.trim(), password);
        if (res.requires_totp) {
          setPendingToken(res.pending_token);
          setCode("");
        } else {
          onLoggedIn(res.access_token!, res.email!);
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("401")) {
        const detail = err.message.split(" — ")[1];
        setError(detail || (pendingToken ? "Invalid authentication code." : "Invalid admin email or password."));
      } else {
        setError("Couldn't reach the server — check that the backend is running and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (pendingToken) {
    return (
      <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div>
          <h2 className="font-bold text-gray-900 dark:text-gray-50">Two-factor code</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Enter the 6-digit code from your authenticator app.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            required
            placeholder="123456"
            className={inputClass}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="whitespace-nowrap rounded-xl bg-gradient-to-br from-sky-600 to-yellow-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-sky-600/25 transition-transform hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Checking…" : "Verify"}
          </button>
        </form>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="button"
          onClick={() => {
            setPendingToken(null);
            setError(null);
          }}
          className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ← Start over
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div>
        <h2 className="font-bold text-gray-900 dark:text-gray-50">Admin login</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Separate from any regular JobNeed account — its own email and password, checked against
          this deployment's admin list only.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input
          type="email"
          required
          placeholder="Admin email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          required
          placeholder="Admin password"
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="whitespace-nowrap rounded-xl bg-gradient-to-br from-sky-600 to-yellow-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-sky-600/25 transition-transform hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Checking…" : "Log in"}
        </button>
      </form>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </section>
  );
}

/**
 * The job-posting side of the admin panel: create/edit/close listings.
 * Session state (who's logged in) lives in useAdminSession, shared with
 * AdminAccountSettings, so a password change or logout there is reflected
 * here immediately too.
 */
export function JobBoardAdmin({
  adminEmail,
  onLoggedOut,
}: {
  adminEmail: string;
  onLoggedOut: () => void;
}) {
  const { showToast } = useToast();
  const [postings, setPostings] = useState<Job[]>([]);
  const [loadingPostings, setLoadingPostings] = useState(true);
  const [form, setForm] = useState(EMPTY_BOARD_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadPostings() {
    setLoadingPostings(true);
    getMyBoardJobs()
      .then(setPostings)
      .catch((e) => {
        if (isAuthError(e)) onLoggedOut();
        else setError("Couldn't load your postings right now.");
      })
      .finally(() => setLoadingPostings(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(loadPostings, []);

  function startEdit(job: Job) {
    setEditingId(job.id);
    setForm({
      title: job.title,
      company: job.company,
      location: job.location,
      remote: /remote/i.test(job.location),
      salaryRange: job.salary_range,
      description: job.description,
      url: job.url,
    });
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_BOARD_FORM);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      title: form.title.trim(),
      company: form.company.trim(),
      location: form.location.trim(),
      remote: form.remote,
      description: form.description.trim(),
      url: form.url.trim(),
      salary_range: form.salaryRange.trim(),
    };
    try {
      if (editingId) {
        await updateBoardJob(editingId, payload);
        showToast("Posting updated");
      } else {
        await createBoardJob(payload);
        showToast("Job posted");
      }
      resetForm();
      loadPostings();
    } catch (e) {
      if (isAuthError(e)) onLoggedOut();
      else setError(e instanceof Error ? e.message : "Couldn't save this posting right now.");
    } finally {
      setSaving(false);
    }
  }

  async function handleClose(job: Job) {
    try {
      await closeBoardJob(job.id);
      showToast("Posting closed");
      loadPostings();
    } catch (e) {
      if (isAuthError(e)) onLoggedOut();
      else setError("Couldn't close this posting right now.");
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-gray-900 dark:text-gray-50">Job board</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Post a job directly on JobNeed — it's indexed like any other source, so it shows up in
            Search and the Assistant right alongside Greenhouse, Lever, and the rest.
          </p>
        </div>
        <button
          onClick={onLoggedOut}
          className="shrink-0 whitespace-nowrap text-xs font-semibold text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
        >
          Log out ({adminEmail})
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Job title</label>
            <input
              required
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Company</label>
            <input
              required
              className={inputClass}
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <div>
            <label className={labelClass}>Location</label>
            <input
              className={inputClass}
              placeholder="e.g. San Francisco, CA"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={form.remote}
              onChange={(e) => setForm({ ...form, remote: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500/40 dark:border-gray-700 dark:bg-gray-900"
            />
            Remote
          </label>
          <div>
            <label className={labelClass}>Salary range (optional)</label>
            <input
              className={inputClass}
              placeholder="e.g. $120k–$150k"
              value={form.salaryRange}
              onChange={(e) => setForm({ ...form, salaryRange: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            required
            rows={4}
            className={inputClass}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Apply URL</label>
          <input
            required
            type="url"
            className={inputClass}
            placeholder="https://... or mailto:you@company.com"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
          />
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-gradient-to-br from-sky-600 to-yellow-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-sky-600/25 transition-transform hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : editingId ? "Update posting" : "Post job"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <div className="space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-600">
          Your postings
        </h3>
        {loadingPostings && <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>}
        {!loadingPostings && postings.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Nothing posted yet.</p>
        )}
        {postings.map((job) => (
          <div
            key={job.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2.5 dark:border-gray-800 dark:bg-gray-950/40"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                {job.title} <span className="font-normal text-gray-400">· {job.company}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {job.location} {job.is_active ? "" : "· closed"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                onClick={() => startEdit(job)}
                className="text-xs font-semibold text-sky-600 hover:underline dark:text-sky-400"
              >
                Edit
              </button>
              {job.is_active && (
                <button
                  onClick={() => handleClose(job)}
                  className="text-xs font-semibold text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
