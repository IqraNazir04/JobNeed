import { Link } from "react-router-dom";
import { Account } from "./Account";
import { Logo } from "../components/Logo";
import { useDarkMode } from "../hooks/useDarkMode";
import { usePageMeta } from "../hooks/usePageMeta";

/**
 * A deliberately separate page, the same way /admin and /blog are: account
 * settings are a narrow, focused task, so this skips the marketing hero,
 * marquee, and 3D scene entirely rather than living inside the one-pager.
 */
export function AccountPage() {
  usePageMeta("Account", "Log in and manage your JobNeed account.");
  const { dark, toggleDark } = useDarkMode();

  return (
    <div className="flex min-h-screen flex-col bg-paper dark:bg-paper-dark">
      <header className="border-b-[3px] border-double border-gray-900 bg-gray-100/90 backdrop-blur-lg dark:border-gray-100 dark:bg-gray-900/90">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center">
            <Logo markClassName="h-7 w-7" wordmarkClassName="hidden sm:inline" />
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDark}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-gray-200 text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              {dark ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
            <Link
              to="/"
              className="whitespace-nowrap rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 sm:text-sm"
            >
              ← Back to JobNeed
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Account />
      </main>
    </div>
  );
}
