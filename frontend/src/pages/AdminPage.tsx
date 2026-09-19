import { motion } from "framer-motion";
import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { AdminAccountSettings } from "../components/AdminAccountSettings";
import { AdminDashboard } from "../components/AdminDashboard";
import { AdminLoginForm, JobBoardAdmin } from "../components/JobBoardAdmin";
import { AdminPosts } from "../components/AdminPosts";
import { AdminSocialLinks } from "../components/AdminSocialLinks";
import { AdminUsersPanel } from "../components/AdminUsersPanel";
import { AdminRole } from "../api/client";
import { Logo } from "../components/Logo";
import { useAdminSession } from "../hooks/useAdminSession";
import { useDarkMode } from "../hooks/useDarkMode";
import { usePageMeta } from "../hooks/usePageMeta";

type SectionId = "dashboard" | "jobs" | "blog" | "social" | "users" | "settings";

function Icon({ path }: { path: ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      {path}
    </svg>
  );
}

const ICONS: Record<SectionId, ReactNode> = {
  dashboard: (
    <Icon
      path={
        <>
          <rect x="3" y="12" width="4" height="8" rx="1" />
          <rect x="10" y="7" width="4" height="13" rx="1" />
          <rect x="17" y="3" width="4" height="17" rx="1" />
        </>
      }
    />
  ),
  jobs: (
    <Icon
      path={
        <>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M3 13h18" />
        </>
      }
    />
  ),
  blog: (
    <Icon
      path={
        <>
          <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
          <path d="M9 13h6M9 17h6M9 9h2" />
        </>
      }
    />
  ),
  social: (
    <Icon
      path={
        <>
          <circle cx="6" cy="12" r="2.5" />
          <circle cx="18" cy="6" r="2.5" />
          <circle cx="18" cy="18" r="2.5" />
          <path d="M8.3 10.7l7.4-4.4M8.3 13.3l7.4 4.4" />
        </>
      }
    />
  ),
  users: (
    <Icon
      path={
        <>
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <circle cx="17.5" cy="9" r="2.5" />
          <path d="M15.5 14a5.5 5.5 0 0 1 5.5 6" />
        </>
      }
    />
  ),
  settings: (
    <Icon
      path={
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
        </>
      }
    />
  ),
};

const SECTIONS: { id: SectionId; label: string; description: string; adminOnly?: boolean }[] = [
  { id: "dashboard", label: "Dashboard", description: "Key metrics and recent activity, at a glance." },
  { id: "jobs", label: "Job board", description: "Post, edit, and close JobNeed's own listings." },
  { id: "blog", label: "Blog", description: "Write, schedule, and publish posts for the public blog." },
  { id: "social", label: "Social links", description: "Manage the social accounts JobNeed links out to." },
  { id: "users", label: "Users", description: "Regular JobNeed accounts, separate from admin accounts.", adminOnly: true },
  { id: "settings", label: "Settings", description: "Your password, two-factor auth, and admin accounts." },
];

function RoleBadge({ role }: { role: AdminRole }) {
  return role === "admin" ? (
    <span className="rounded-full bg-gradient-to-br from-sky-600 to-yellow-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm shadow-sky-600/25">
      Admin
    </span>
  ) : (
    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
      Editor
    </span>
  );
}

function DarkModeButton({ dark, toggleDark }: { dark: boolean; toggleDark: () => void }) {
  return (
    <button
      onClick={toggleDark}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
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
  );
}

/**
 * A deliberately separate page rather than a section of the one-pager: an
 * admin's job here is a back-office one, so it gets a proper app shell
 * (sidebar + section switcher) instead of a single long scroll — everyone
 * lands on Dashboard and the section they pick is the only one rendered,
 * rather than mounting all six at once.
 */
export function AdminPage() {
  usePageMeta("Admin", "Manage JobNeed's job board, blog, and accounts.");
  const { dark, toggleDark } = useDarkMode();
  const { adminEmail, adminRole, checkedSession, persist, logOut } = useAdminSession();
  const [section, setSection] = useState<SectionId>("dashboard");

  if (!checkedSession) return null;

  if (!adminEmail) {
    return (
      <div className="flex min-h-screen flex-col bg-paper dark:bg-paper-dark">
        <header className="border-b-[3px] border-double border-gray-900 bg-gray-100/90 backdrop-blur-lg dark:border-gray-100 dark:bg-gray-900/90">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
            <Link to="/" className="flex items-center">
              <Logo markClassName="h-7 w-7" wordmarkClassName="hidden sm:inline" />
            </Link>
            <div className="flex items-center gap-2">
              <DarkModeButton dark={dark} toggleDark={toggleDark} />
              <Link
                to="/"
                className="whitespace-nowrap rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 sm:text-sm"
              >
                ← Back to JobNeed
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-8">
          <div className="space-y-1">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">
              Admin
            </span>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-gray-950 dark:text-gray-50">
              JobNeed back office
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Separate from the site's regular accounts — its own login, its own passwords.
            </p>
          </div>
          <AdminLoginForm onLoggedIn={persist} />
        </main>
      </div>
    );
  }

  if (!adminRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper dark:bg-paper-dark">
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading your session…</p>
      </div>
    );
  }

  const visibleSections = SECTIONS.filter((s) => !s.adminOnly || adminRole === "admin");
  const active = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];

  return (
    <div className="flex min-h-screen bg-paper dark:bg-paper-dark">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-gray-200 bg-gray-100/60 dark:border-gray-800 dark:bg-gray-900/60 sm:flex">
        <Link to="/" className="flex items-center px-5 py-5">
          <Logo markClassName="h-7 w-7" wordmarkClassName="inline" />
        </Link>
        <nav className="flex-1 space-y-1 px-3">
          {visibleSections.map((s) => {
            const isActive = s.id === active.id;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className="relative block w-full text-left"
              >
                {isActive && (
                  <motion.span
                    layoutId="admin-nav-active"
                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-sky-600 to-yellow-600 shadow-md shadow-sky-600/25"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span
                  className={`relative z-10 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                    isActive ? "text-white" : "text-gray-600 hover:bg-gray-200/60 dark:text-gray-400 dark:hover:bg-gray-800"
                  }`}
                >
                  {ICONS[s.id]}
                  {s.label}
                </span>
              </button>
            );
          })}
        </nav>
        <div className="space-y-3 border-t border-gray-200 p-4 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-600 to-yellow-600 text-xs font-bold text-white">
              {adminEmail[0].toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-gray-900 dark:text-gray-100">{adminEmail}</p>
              <RoleBadge role={adminRole} />
            </div>
          </div>
          <button
            onClick={logOut}
            className="w-full whitespace-nowrap rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:border-red-200 hover:text-red-500 dark:border-gray-700 dark:text-gray-400 dark:hover:border-red-900 dark:hover:text-red-400"
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-gray-100/90 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-900/90">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:hidden">
            <Link to="/" className="flex items-center">
              <Logo markClassName="h-6 w-6" wordmarkClassName="hidden" />
            </Link>
            <div className="flex items-center gap-2">
              <RoleBadge role={adminRole} />
              <DarkModeButton dark={dark} toggleDark={toggleDark} />
              <Link
                to="/"
                className="whitespace-nowrap rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-400"
              >
                Exit
              </Link>
            </div>
          </div>
          <div className="scrollbar-hide flex gap-1 overflow-x-auto border-t border-gray-200 px-3 py-2 dark:border-gray-800 sm:hidden">
            {visibleSections.map((s) => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  s.id === active.id
                    ? "bg-gradient-to-br from-sky-600 to-yellow-600 text-white shadow-sm shadow-sky-600/25"
                    : "bg-gray-200/60 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="mx-auto hidden max-w-4xl items-center justify-between gap-3 px-6 py-4 sm:flex">
            <div>
              <h1 className="font-heading text-xl font-bold tracking-tight text-gray-950 dark:text-gray-50">
                {active.label}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{active.description}</p>
            </div>
            <DarkModeButton dark={dark} toggleDark={toggleDark} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {section === "dashboard" && <AdminDashboard onLoggedOut={logOut} />}
          {section === "jobs" && <JobBoardAdmin onLoggedOut={logOut} />}
          {section === "blog" && <AdminPosts onLoggedOut={logOut} />}
          {section === "social" && <AdminSocialLinks onLoggedOut={logOut} />}
          {section === "users" && adminRole === "admin" && <AdminUsersPanel onLoggedOut={logOut} />}
          {section === "settings" && (
            <AdminAccountSettings adminEmail={adminEmail} adminRole={adminRole} onLoggedOut={logOut} />
          )}
        </main>
      </div>
    </div>
  );
}
