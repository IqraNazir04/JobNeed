import { FormEvent, useEffect, useState } from "react";
import {
  adminLogin,
  closeBoardJob,
  createBoardJob,
  getMyBoardJobs,
  Job,
  setAdminToken,
  updateBoardJob,
} from "../api/client";
import { useToast } from "../context/ToastContext";

const ADMIN_TOKEN_KEY = "jobneed:admin-token";
const ADMIN_EMAIL_KEY = "jobneed:admin-email";

function isAuthError(e: unknown): boolean {
  return e instanceof Error && (e.message.includes("401") || e.message.includes("403"));
}

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

function AdminLoginForm({ onLoggedIn }: { onLoggedIn: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await adminLogin(email.trim(), password);
      setAdminToken(res.access_token);
      try {
        localStorage.setItem(ADMIN_TOKEN_KEY, res.access_token);
        localStorage.setItem(ADMIN_EMAIL_KEY, res.email);
      } catch {
        // private mode / quota — admin session still works for this tab
      }
      onLoggedIn(res.email);
    } catch {
      setError("Invalid admin email or password.");
    } finally {
      setLoading(false);
    }
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
 * The job board's whole admin surface: its own login gate plus the
 * post/edit/close panel once authenticated. Deliberately self-contained
 * (own session handling, own styles) so it can be dropped onto its own
 * page without pulling in anything from the rest of the site.
 */
export function JobBoardAdmin() {
  const { showToast } = useToast();
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [checkedSession, setCheckedSession] = useState(false);
  const [postings, setPostings] = useState<Job[]>([]);
  const [loadingPostings, setLoadingPostings] = useState(true);
  const [form, setForm] = useState(EMPTY_BOARD_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function logOutAdmin() {
    setAdminToken(null);
    try {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_EMAIL_KEY);
    } catch {
      // ignore
    }
    setAdminEmail(null);
    setPostings([]);
  }

  function loadPostings() {
    setLoadingPostings(true);
    getMyBoardJobs()
      .then(setPostings)
      .catch((e) => {
        if (isAuthError(e)) logOutAdmin();
        else setError("Couldn't load your postings right now.");
      })
      .finally(() => setLoadingPostings(false));
  }

  // Restore a persisted admin session on mount — there's no backing user
  // account to re-fetch, so we optimistically trust the stored token and
  // let the first request's 401/403 clear it if it's no longer valid.
  useEffect(() => {
    let token: string | null = null;
    let email: string | null = null;
    try {
      token = localStorage.getItem(ADMIN_TOKEN_KEY);
      email = localStorage.getItem(ADMIN_EMAIL_KEY);
    } catch {
      // ignore
    }
    if (token && email) {
      setAdminToken(token);
      setAdminEmail(email);
    }
    setCheckedSession(true);
  }, []);

  useEffect(() => {
    if (adminEmail) loadPostings();
  }, [adminEmail]);

  if (!checkedSession) return null;

  if (!adminEmail) {
    return <AdminLoginForm onLoggedIn={setAdminEmail} />;
  }

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
      if (isAuthError(e)) logOutAdmin();
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
      if (isAuthError(e)) logOutAdmin();
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
          onClick={logOutAdmin}
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
