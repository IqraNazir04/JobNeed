import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDarkMode } from "../hooks/useDarkMode";
import { Footer } from "./Footer";
import { Logo } from "./Logo";
import { Marquee } from "./Marquee";
import { MotivationScene3D } from "./MotivationScene3D";

const NAV_SECTIONS = [
  { id: "home", label: "Home" },
  { id: "search", label: "Search" },
  { id: "assistant", label: "Assistant" },
  { id: "tracker", label: "Tracker" },
  { id: "cv", label: "CV" },
  { id: "interview", label: "Interview" },
  { id: "speaking", label: "Speaking" },
];

function NavItem({ id, active, children }: { id: string; active: boolean; children: ReactNode }) {
  return (
    <a href={`#${id}`} className="relative block shrink-0">
      {active && (
        <motion.span
          layoutId="nav-active-pill"
          className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-600 to-yellow-600 shadow-md shadow-sky-600/25"
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      )}
      <span
        className={`relative z-10 block rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors sm:px-3.5 sm:text-sm ${
          active
            ? "text-white"
            : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        }`}
      >
        {children}
      </span>
    </a>
  );
}

function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const elements = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}

export function Layout({ children }: { children: ReactNode }) {
  const { dark, toggleDark } = useDarkMode();
  const { user } = useAuth();
  const activeSection = useScrollSpy(NAV_SECTIONS.map((s) => s.id));

  return (
    <div className="flex min-h-screen flex-col bg-paper dark:bg-paper-dark">
      <header className="sticky top-0 z-20 border-b-[3px] border-double border-gray-900 bg-gray-100/90 backdrop-blur-lg dark:border-gray-100 dark:bg-gray-900/90">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-2 gap-x-2 px-4 py-4">
          <a href="#home" className="flex shrink-0 items-center">
            <Logo markClassName="h-7 w-7" wordmarkClassName="hidden sm:inline" />
          </a>
          <nav className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:flex-initial sm:gap-2">
            <div className="scrollbar-hide nav-scroll-fade flex min-w-0 items-center gap-1 overflow-x-auto rounded-full bg-gray-100 p-1 dark:bg-gray-800/60">
              {NAV_SECTIONS.map((s) => (
                <NavItem key={s.id} id={s.id} active={activeSection === s.id}>
                  {s.label}
                </NavItem>
              ))}
            </div>
            <Link
              to="/blog"
              className="hidden whitespace-nowrap rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 sm:inline-block sm:text-sm"
            >
              Blog
            </Link>
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
            {user ? (
              <Link
                to="/account"
                title={user.email}
                aria-label={`Account for ${user.email}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-600 to-yellow-600 text-xs font-bold text-white shadow-md shadow-sky-600/25 transition-transform hover:scale-105 active:scale-95"
              >
                {user.email[0].toUpperCase()}
              </Link>
            ) : (
              <Link
                to="/account"
                className="whitespace-nowrap rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 sm:text-sm"
              >
                Log in
              </Link>
            )}
          </nav>
        </div>
      </header>
      <Marquee />
      <div className="relative flex w-full flex-col items-center overflow-hidden bg-black">
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_50%_35%,rgba(56,189,248,0.16),transparent_60%)]" />
        <MotivationScene3D className="relative mx-auto h-72 w-full max-w-3xl sm:h-96 lg:h-[32rem]" />
        <div className="relative pb-6 sm:pb-8">
          <span className="whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-center font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gray-200 backdrop-blur-md sm:text-xs">
            Momentum for your job search
          </span>
        </div>
      </div>
      <main className="relative mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>
      <Footer />
    </div>
  );
}
