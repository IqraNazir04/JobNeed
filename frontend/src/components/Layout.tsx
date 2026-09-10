import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDarkMode } from "../hooks/useDarkMode";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors sm:px-3.5 sm:text-sm ${
    isActive
      ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/25"
      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
  }`;

export function Layout() {
  const { dark, toggleDark } = useDarkMode();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-y-2 gap-x-2 px-4 py-3.5">
          <NavLink to="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-extrabold text-white shadow-md shadow-indigo-600/25">
              J
            </span>
            <span className="hidden text-lg font-extrabold tracking-tight text-gray-900 dark:text-gray-50 sm:inline">
              JobNeed
            </span>
          </NavLink>
          <nav className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1 dark:bg-gray-800/60">
              <NavLink to="/" end className={navLinkClass}>
                Search
              </NavLink>
              <NavLink to="/assistant" className={navLinkClass}>
                Assistant
              </NavLink>
              <NavLink to="/saved" className={navLinkClass}>
                Saved
              </NavLink>
              <NavLink to="/cv" className={navLinkClass}>
                CV
              </NavLink>
              <NavLink to="/interview" className={navLinkClass}>
                Interview
              </NavLink>
              <NavLink to="/speaking" className={navLinkClass}>
                Speaking
              </NavLink>
            </div>
            <button
              onClick={toggleDark}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
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
            {user ? (
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                title={user.email}
                aria-label={`Log out of ${user.email}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-bold text-white shadow-md shadow-indigo-600/25"
              >
                {user.email[0].toUpperCase()}
              </button>
            ) : (
              <NavLink
                to="/login"
                className="whitespace-nowrap rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 sm:text-sm"
              >
                Log in
              </NavLink>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
