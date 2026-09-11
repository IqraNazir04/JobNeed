import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDarkMode } from "../hooks/useDarkMode";
import { Logo } from "./Logo";
import { Marquee } from "./Marquee";
import { PageTransition } from "./PageTransition";

function NavItem({ to, end, children }: { to: string; end?: boolean; children: ReactNode }) {
  return (
    <NavLink to={to} end={end} className="relative block shrink-0">
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="nav-active-pill"
              className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 shadow-md shadow-indigo-600/25"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
          <span
            className={`relative z-10 block rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors sm:px-3.5 sm:text-sm ${
              isActive
                ? "text-white"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            {children}
          </span>
        </>
      )}
    </NavLink>
  );
}

export function Layout() {
  const { dark, toggleDark } = useDarkMode();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-paper dark:bg-paper-dark">
      <header className="sticky top-0 z-20 border-b-[3px] border-double border-gray-900 bg-paper/95 backdrop-blur-sm dark:border-gray-100 dark:bg-paper-dark/95">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-y-2 gap-x-2 px-4 py-4">
          <NavLink to="/" className="flex shrink-0 items-center">
            <Logo markClassName="h-7 w-7" wordmarkClassName="hidden sm:inline" />
          </NavLink>
          <nav className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:flex-initial sm:gap-2">
            <div className="scrollbar-hide nav-scroll-fade flex min-w-0 items-center gap-1 overflow-x-auto rounded-full bg-gray-100 p-1 dark:bg-gray-800/60">
              <NavItem to="/" end>
                Search
              </NavItem>
              <NavItem to="/assistant">Assistant</NavItem>
              <NavItem to="/saved">Saved</NavItem>
              <NavItem to="/cv">CV</NavItem>
              <NavItem to="/interview">Interview</NavItem>
              <NavItem to="/speaking">Speaking</NavItem>
              <NavItem to="/about">About</NavItem>
            </div>
            <button
              onClick={toggleDark}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-gray-200 text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={dark ? "sun" : "moon"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex"
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
                </motion.span>
              </AnimatePresence>
            </button>
            {user ? (
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                title={user.email}
                aria-label={`Log out of ${user.email}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-bold text-white shadow-md shadow-indigo-600/25 transition-transform hover:scale-105 active:scale-95"
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
      <Marquee />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      <footer className="border-t border-gray-300 py-6 text-center font-serif text-sm italic text-gray-500 dark:border-gray-800 dark:text-gray-600">
        JobNeed — AI-powered job search
      </footer>
    </div>
  );
}
