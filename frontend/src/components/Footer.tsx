import { Logo } from "./Logo";

const FEATURE_LINKS = [
  { to: "#search", label: "Job Search" },
  { to: "#assistant", label: "AI Assistant" },
  { to: "#cv", label: "CV Builder" },
  { to: "#interview", label: "Interview Prep" },
  { to: "#speaking", label: "Speaking Practice" },
  { to: "#tracker", label: "Application Tracker" },
];

const ACCOUNT_LINKS = [
  { to: "#account", label: "Account" },
  { to: "/blog", label: "Blog" },
  { to: "/admin", label: "Admin" },
];

export function Footer() {
  return (
    <footer className="dark border-t border-gray-800 bg-gray-950">
      <div className="mx-auto grid max-w-4xl gap-8 px-4 py-10 sm:grid-cols-[1.3fr_1fr_1fr]">
        <div className="space-y-2.5">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            One place to search every job board, tailor your CV and cover letters, prepare for
            interviews, and practice your spoken English — powered by Claude.
          </p>
        </div>

        <nav aria-label="Features">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-600">
            Features
          </h2>
          <ul className="mt-3 space-y-2">
            {FEATURE_LINKS.map((link) => (
              <li key={link.to}>
                <a
                  href={link.to}
                  className="text-sm text-gray-600 transition-colors hover:text-sky-600 dark:text-gray-400 dark:hover:text-sky-400"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Account">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-600">
            Account
          </h2>
          <ul className="mt-3 space-y-2">
            {ACCOUNT_LINKS.map((link) => (
              <li key={link.to}>
                <a
                  href={link.to}
                  className="text-sm text-gray-600 transition-colors hover:text-sky-600 dark:text-gray-400 dark:hover:text-sky-400"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-gray-400 dark:text-gray-600 sm:flex-row">
          <span>© {new Date().getFullYear()} JobNeed. All rights reserved.</span>
          <span>Built with Claude.</span>
        </div>
      </div>
    </footer>
  );
}
