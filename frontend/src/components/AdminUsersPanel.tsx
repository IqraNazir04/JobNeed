import { useEffect, useState } from "react";
import { AdminUser, deleteAdminUser, listAdminUsers } from "../api/client";
import { useToast } from "../context/ToastContext";
import { isAuthError } from "../hooks/useAdminSession";

/**
 * Regular job-seeker accounts, not admin accounts — gated to the "admin"
 * role by the backend (403 for editors), so this is only ever mounted
 * when adminRole === "admin".
 */
export function AdminUsersPanel({ onLoggedOut }: { onLoggedOut: () => void }) {
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  function reload() {
    listAdminUsers()
      .then(setUsers)
      .catch((e) => {
        if (isAuthError(e)) onLoggedOut();
        else setError("Couldn't load users right now.");
      });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(reload, []);

  async function handleRemove(user: AdminUser) {
    if (!confirm(`Remove ${user.email}? This deletes their saved jobs and CV too.`)) return;
    setRemovingId(user.id);
    try {
      await deleteAdminUser(user.id);
      showToast("User removed");
      reload();
    } catch (e) {
      if (isAuthError(e)) onLoggedOut();
      else setError("Couldn't remove that user right now.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div>
        <h2 className="font-bold text-gray-900 dark:text-gray-50">Users</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Regular JobNeed accounts — separate from the admin panel's own accounts.
        </p>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {users === null && <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>}
      {users?.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No users yet.</p>}

      {users && users.length > 0 && (
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2.5 dark:border-gray-800 dark:bg-gray-950/40"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{u.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Joined {new Date(u.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleRemove(u)}
                disabled={removingId === u.id}
                className="shrink-0 text-xs font-semibold text-gray-500 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:text-red-400"
              >
                {removingId === u.id ? "Removing…" : "Remove"}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
