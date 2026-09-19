import { FormEvent, useEffect, useState } from "react";
import { createSocialLink, deleteSocialLink, listSocialLinks, SocialLink } from "../api/client";
import { useToast } from "../context/ToastContext";
import { isAuthError } from "../hooks/useAdminSession";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-sky-500/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500";
const labelClass = "text-xs font-semibold text-gray-500 dark:text-gray-400";
const buttonClass =
  "rounded-xl bg-gradient-to-br from-sky-600 to-yellow-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-sky-600/25 transition-transform hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

/** The social accounts JobNeed links out to (LinkedIn, X, GitHub, etc.) —
 * not a per-user social connection. */
export function AdminSocialLinks({ onLoggedOut }: { onLoggedOut: () => void }) {
  const { showToast } = useToast();
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    setLoading(true);
    listSocialLinks()
      .then(setLinks)
      .catch((e) => {
        if (isAuthError(e)) onLoggedOut();
        else setError("Couldn't load social links right now.");
      })
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(reload, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createSocialLink({ platform: platform.trim(), url: url.trim(), display_order: links.length });
      showToast("Social link added");
      setPlatform("");
      setUrl("");
      reload();
    } catch (e) {
      if (isAuthError(e)) onLoggedOut();
      else setError("Couldn't add that link right now.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(link: SocialLink) {
    try {
      await deleteSocialLink(link.id);
      showToast("Social link removed");
      reload();
    } catch (e) {
      if (isAuthError(e)) onLoggedOut();
      else setError("Couldn't remove that link right now.");
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>}

      {!loading && (
        <div className="space-y-2">
          {links.map((link) => (
            <div
              key={link.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2.5 dark:border-gray-800 dark:bg-gray-950/40"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{link.platform}</p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-500">{link.url}</p>
              </div>
              <button
                onClick={() => handleRemove(link)}
                className="shrink-0 text-xs font-semibold text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
              >
                Remove
              </button>
            </div>
          ))}
          {links.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No social links yet.</p>}
        </div>
      )}

      <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label className={labelClass}>Platform</label>
          <input
            required
            placeholder="e.g. LinkedIn"
            className={inputClass}
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>URL</label>
          <input
            required
            type="url"
            placeholder="https://..."
            className={inputClass}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <button type="submit" disabled={saving} className={`whitespace-nowrap ${buttonClass}`}>
          {saving ? "Adding…" : "Add link"}
        </button>
      </form>
    </section>
  );
}
