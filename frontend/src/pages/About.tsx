import { motion } from "framer-motion";
import { ComparisonRow, FeatureComparison } from "../components/FeatureComparison";
import { MotivationalQuote } from "../components/MotivationalQuote";
import { PageHeader } from "../components/PageHeader";
import { staggerContainer, staggerItem } from "../components/PageTransition";
import { PhotoScroller, ScrollerPhoto } from "../components/PhotoScroller";
import { HomeIcon } from "../components/SectionIcons";
import { Slide, Slider } from "../components/Slider";

const COMPARISON: ComparisonRow[] = [
  { feature: "Job sources searched at once", without: "1", withUs: "9" },
  { feature: "CV tailored to the job description", without: false, withUs: true },
  { feature: "Interview questions from the real posting", without: false, withUs: true },
  { feature: "Feedback on spoken English", without: false, withUs: true },
  { feature: "Typical time per application", without: "~45 min", withUs: "~5 min" },
];

const PHOTOS: ScrollerPhoto[] = [
  {
    src: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80",
    alt: "An overhead view of a desk with laptops and notebooks",
  },
  {
    src: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80",
    alt: "A modern office interior",
  },
  {
    src: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80",
    alt: "An open-plan office full of people working",
  },
  {
    src: "https://images.unsplash.com/photo-1560264357-8d9202250f21?auto=format&fit=crop&w=900&q=80",
    alt: "A team focused on computer monitors",
  },
  {
    src: "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=900&q=80",
    alt: "A person working in a server room",
  },
  {
    src: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
    alt: "A team collaborating around a table with laptops",
  },
  {
    src: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=900&q=80",
    alt: "A presenter leading a meeting",
  },
  {
    src: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=900&q=80",
    alt: "Two colleagues celebrating with a high five",
  },
];

const iconProps = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const SLIDES: Slide[] = [
  {
    kicker: "Search",
    title: "AI-powered search",
    description:
      "JobNeed indexes postings from Greenhouse, Lever, LinkedIn, Upwork, Indeed, Google Jobs, Remote OK, Ashby, and Jobicy, then ranks them by real fit using retrieval-augmented search — not just keyword matching.",
    icon: (
      <svg {...iconProps}>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
    ),
  },
  {
    kicker: "CV Builder",
    title: "Tailor your CV in seconds",
    description:
      "Paste a job description and JobNeed rewrites your CV's emphasis to match it, so every application highlights what that role actually cares about.",
    icon: (
      <svg {...iconProps}>
        <path d="M14 3v5h5" />
        <path d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
        <path d="M9 13h6M9 17h6" />
      </svg>
    ),
  },
  {
    kicker: "Interview Prep",
    title: "Practice with real context",
    description:
      "Interview Prep pulls the actual job posting — or a role you searched for — and generates likely questions with model answers, powered by Claude.",
    icon: (
      <svg {...iconProps}>
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
  {
    kicker: "Speaking Practice",
    title: "Sound more fluent",
    description:
      "Answer out loud using your microphone and get feedback on grammar, fluency, filler words, and phrasing — not just a transcript of what you said.",
    icon: (
      <svg {...iconProps}>
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0M12 19v3" />
      </svg>
    ),
  },
];

const STATS = [
  {
    value: "9",
    label: "Job sources indexed",
    icon: (
      <svg {...iconProps}>
        <path d="M12 2 2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    value: "7",
    label: "Career tools, one page",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="4" width="7" height="7" rx="1.5" />
        <rect x="14" y="4" width="7" height="7" rx="1.5" />
        <rect x="3" y="15" width="7" height="7" rx="1.5" />
        <rect x="14" y="15" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    value: "4",
    label: "AI-powered tools",
    icon: (
      <svg {...iconProps}>
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    value: "100%",
    label: "Built on Claude",
    icon: (
      <svg {...iconProps}>
        <path d="M12 2 4 5v6c0 5 3.4 8.6 8 11 4.6-2.4 8-6 8-11V5l-8-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    value: "24/7",
    label: "AI availability",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </svg>
    ),
  },
  {
    value: "0",
    label: "Tabs left to juggle",
    icon: (
      <svg {...iconProps}>
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ),
  },
];

const SOURCE_COMPARISON = [
  { label: "Without JobNeed", value: 1, of: 9 },
  { label: "With JobNeed", value: 9, of: 9 },
];

export function About() {
  return (
    <div className="relative isolate space-y-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <PageHeader
          kicker="Home"
          title="Built for the modern"
          emphasis="job search."
          subtitle="JobNeed is a single place to search, prepare, and apply — with AI doing the tedious parts so you can focus on the roles that actually fit."
          level="h1"
          accent="sky"
          icon={<HomeIcon />}
        />
        <div className="relative hidden shrink-0 sm:block">
          <motion.img
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
            alt="A person reviewing notes at a desk"
            className="h-44 w-full rounded-2xl object-cover shadow-lg shadow-gray-900/10 lg:h-40 lg:w-80"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1.6fr_1fr]">
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          Job searching is one of the most time-consuming things most people do — juggling half a
          dozen tabs of job boards, rewriting the same CV over and over, and guessing what an
          interviewer might ask. JobNeed exists to take the repetitive parts off your plate: one
          search across every source, one CV that adapts to each role, and real practice before it
          counts. The goal isn't to replace your judgment about which roles are worth pursuing — it's
          to give you back the time and energy to make that judgment well.
        </p>
        <MotivationalQuote />
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-yellow-50/60 p-6 dark:border-sky-500/10 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 sm:p-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(rgba(14,165,233,0.35) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gradient-to-r from-sky-500 to-yellow-500" />
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">
              By the numbers
            </span>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4"
          >
            {STATS.map((s) => (
              <motion.div
                key={s.label}
                variants={staggerItem}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white/80 p-4 text-center shadow-sm backdrop-blur-sm transition-colors hover:border-sky-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/70 dark:hover:border-sky-500/30 sm:p-6"
              >
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300 sm:h-10 sm:w-10">
                  {s.icon}
                </div>
                <div className="mt-3 bg-gradient-to-br from-sky-600 to-yellow-600 bg-clip-text font-heading text-3xl font-bold text-transparent sm:text-4xl">
                  {s.value}
                </div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-4 rounded-2xl border border-gray-200 bg-white/80 p-4 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/70 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Job sources searched per query
            </p>
            <div className="mt-3 space-y-2.5">
              {SOURCE_COMPARISON.map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-xs text-gray-500 dark:text-gray-400">{row.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(row.value / row.of) * 100}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className={`h-2 rounded-full ${
                        row.value === row.of ? "bg-gradient-to-r from-sky-500 to-yellow-500" : "bg-gray-400 dark:bg-gray-600"
                      }`}
                    />
                  </div>
                  <span className="w-5 shrink-0 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">
          Why JobNeed
        </span>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-gray-950 dark:text-gray-50 sm:text-3xl">
          Compare it to <span className="text-sky-600 dark:text-sky-400">doing it yourself.</span>
        </h2>
        <FeatureComparison rows={COMPARISON} />
      </div>

      <div className="relative isolate space-y-3">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-4 -top-16 -z-10 h-16 w-16 text-sky-500/70 dark:text-sky-400/60"
          style={{
            backgroundImage: "radial-gradient(currentColor 2px, transparent 2px)",
            backgroundSize: "16px 16px",
          }}
        />
        <div className="pointer-events-none absolute -bottom-8 -right-8 -z-10 h-48 w-48 rounded-full bg-gradient-to-br from-yellow-400 to-sky-500 opacity-30 blur-2xl dark:opacity-40" />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-5 -top-9 -z-10 hidden h-20 w-20 rotate-12 rounded-2xl border-[6px] border-sky-500/50 dark:border-sky-400/50 sm:block"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-6 left-1/3 -z-10 hidden h-14 w-14 -rotate-6 rounded-full border-[6px] border-yellow-500/40 dark:border-yellow-400/40 md:block"
        />

        <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">
          What's inside
        </span>
        <Slider slides={SLIDES} />
      </div>

      <div className="space-y-3">
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">
          Gallery
        </span>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-gray-950 dark:text-gray-50 sm:text-3xl">
          Real work, <span className="text-sky-600 dark:text-sky-400">real teams.</span>
        </h2>
        <PhotoScroller photos={PHOTOS} />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm shadow-gray-900/[0.03] dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
        <p className="font-heading text-xl font-semibold text-gray-800 dark:text-gray-200">
          "Search once, prepare everywhere."
        </p>
        <a
          href="#search"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-sky-600 to-yellow-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-600/25 transition-transform hover:brightness-110 active:scale-[0.98]"
        >
          Start searching
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
}
