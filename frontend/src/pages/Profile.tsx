import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getGithubStats, GithubStats, updateProfile } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { usePageMeta } from "../hooks/usePageMeta";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500";
const labelClass = "text-xs font-semibold text-gray-500 dark:text-gray-400";

export function Profile() {
  usePageMeta(
    "Your Profile",
    "Connect your LinkedIn, Indeed, Upwork, and GitHub profiles to personalize your job search."
  );

  const { user, loading, logout, setUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [indeedUrl, setIndeedUrl] = useState("");
  const [upworkUrl, setUpworkUrl] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [githubStats, setGithubStats] = useState<GithubStats | null>(null);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [loadingGithub, setLoadingGithub] = useState(false);

  // Sync the form from the account whenever it (re)loads — including the
  // first render after a page refresh, when `user` starts null until the
  // token is validated, and again right after a successful save.
  useEffect(() => {
    if (!user) return;
    setLinkedinUrl(user.linkedin_url);
    setIndeedUrl(user.indeed_url);
    setUpworkUrl(user.upwork_url);
    setGithubUsername(user.github_username);
  }, [user]);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user?.github_username) return;
    setLoadingGithub(true);
    getGithubStats(user.github_username)
      .then(setGithubStats)
      .catch(() => setGithubError("Couldn't load GitHub data for this username."))
      .finally(() => setLoadingGithub(false));
  }, [user?.github_username]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateProfile({
        linkedin_url: linkedinUrl.trim(),
        indeed_url: indeedUrl.trim(),
        upwork_url: upworkUrl.trim(),
        github_username: githubUsername.trim(),
      });
      setUser(updated);
      showToast("Profile saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save your profile right now.");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        kicker="Profile"
        title="Manage your"
        emphasis="account."
        subtitle="Connect your other profiles so JobNeed can write sharper cover letters and personalize your search around your real skills."
      />

      <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="font-bold text-gray-900 dark:text-gray-50">Account</h2>
        <div>
          <p className={labelClass}>Email</p>
          <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">{user.email}</p>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="font-bold text-gray-900 dark:text-gray-50">Connected profiles</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          LinkedIn, Indeed, and Upwork don't offer a public way to read profile data automatically —
          these links are kept as context for your cover letters. GitHub does have a public API, so
          JobNeed pulls your top languages from it to help personalize search.
        </p>
        <div className="space-y-3">
          <div>
            <label className={labelClass}>LinkedIn profile URL</label>
            <input
              className={inputClass}
              placeholder="https://linkedin.com/in/your-name"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Indeed profile URL</label>
            <input
              className={inputClass}
              placeholder="https://indeed.com/r/your-name/..."
              value={indeedUrl}
              onChange={(e) => setIndeedUrl(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Upwork profile URL</label>
            <input
              className={inputClass}
              placeholder="https://upwork.com/freelancers/~..."
              value={upworkUrl}
              onChange={(e) => setUpworkUrl(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>GitHub username</label>
            <input
              className={inputClass}
              placeholder="octocat"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-indigo-600/25 transition-transform hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </section>

      {user.github_username && (
        <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="font-bold text-gray-900 dark:text-gray-50">GitHub</h2>
          {loadingGithub && <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>}
          {githubError && <p className="text-sm text-red-600 dark:text-red-400">{githubError}</p>}
          {githubStats && (
            <div className="flex items-start gap-4">
              {githubStats.avatar_url && (
                <img src={githubStats.avatar_url} alt="" className="h-14 w-14 rounded-full" />
              )}
              <div className="space-y-1.5">
                <a
                  href={githubStats.profile_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-bold text-gray-900 hover:underline dark:text-gray-50"
                >
                  {githubStats.name || githubStats.username}
                </a>
                {githubStats.bio && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{githubStats.bio}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {githubStats.public_repos} public repos · {githubStats.followers} followers
                </p>
                {githubStats.top_languages.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {githubStats.top_languages.map((lang) => (
                      <span
                        key={lang}
                        className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      <button
        onClick={() => {
          logout();
          navigate("/");
        }}
        className="text-sm font-semibold text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
      >
        Log out
      </button>
    </div>
  );
}
