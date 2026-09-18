import { useEffect, useState } from "react";
import { setAdminToken } from "../api/client";

const ADMIN_TOKEN_KEY = "jobneed:admin-token";
const ADMIN_EMAIL_KEY = "jobneed:admin-email";

export function isAuthError(e: unknown): boolean {
  return e instanceof Error && (e.message.includes("401") || e.message.includes("403"));
}

/**
 * The admin panel's whole session lives here, independent of the regular
 * user auth context — a single instance is created once in AdminPage and
 * passed down, so the job-posting panel and the account-settings panel
 * (which can log the session out, e.g. after a password change) always
 * agree on whether anyone is logged in.
 */
export function useAdminSession() {
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [checkedSession, setCheckedSession] = useState(false);

  // Restore a persisted session on mount — there's no backing user account
  // to re-fetch, so we optimistically trust the stored token and let the
  // first request's 401/403 clear it if it's no longer valid.
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

  function persist(token: string, email: string) {
    setAdminToken(token);
    try {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      localStorage.setItem(ADMIN_EMAIL_KEY, email);
    } catch {
      // private mode / quota — session still works for this tab
    }
    setAdminEmail(email);
  }

  function logOut() {
    setAdminToken(null);
    try {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_EMAIL_KEY);
    } catch {
      // ignore
    }
    setAdminEmail(null);
  }

  return { adminEmail, checkedSession, persist, logOut };
}
