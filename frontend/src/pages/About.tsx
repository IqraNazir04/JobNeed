import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ComparisonRow, FeatureComparison } from "../components/FeatureComparison";
import { GradientMesh } from "../components/GradientMesh";
import { MotivationalQuote } from "../components/MotivationalQuote";
import { PageHeader } from "../components/PageHeader";
import { staggerContainer, staggerItem } from "../components/PageTransition";
import { PhotoScroller, ScrollerPhoto } from "../components/PhotoScroller";
import { RotatingBadge } from "../components/RotatingBadge";
import { Slide, Slider } from "../components/Slider";
import { usePageMeta } from "../hooks/usePageMeta";

const COMPARISON: ComparisonRow[] = [
  { feature: "Job sources searched at once", without: "1", withUs: "7" },
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
      "JobNeed indexes postings from Greenhouse, Lever, LinkedIn, Upwork, Indeed, Google Jobs, and Remote OK, then ranks them by real fit using retrieval-augmented search — not just keyword matching.",
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
  { value: "7", label: "Job sources indexed" },
  { value: "4", label: "AI-powered tools" },
  { value: "100%", label: "Built on Claude" },
];

export function About() {
  usePageMeta(
    "AI-Powered Job Search & Career Platform",
    "Search Greenhouse, Lever, LinkedIn, Upwork, Indeed, Google Jobs, and Remote OK in one place. Tailor your CV, write cover letters, prep for interviews, and practice your spoken English — all powered by AI."
  );

  return (
    <div className="relative isolate space-y-10">
      <div className="pointer-events-none absolute -left-24 -top-10 -z-10 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 opacity-[0.14] blur-3xl dark:opacity-[0.22]" />
      <div className="pointer-events-none absolute -right-16 top-64 -z-10 h-72 w-72 rounded-full bg-gradient-to-br from-violet-400 to-indigo-400 opacity-[0.1] blur-3xl dark:opacity-[0.18]" />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          kicker="Home"
          title="Built for the modern"
          emphasis="job search."
          subtitle="JobNeed is a single place to search, prepare, and apply — with AI doing the tedious parts so you can focus on the roles that actually fit."
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
          <RotatingBadge text="OUR MISSION · ONE PLACE · EVERY STEP · " className="absolute -bottom-6 -left-6 hidden lg:block" />
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

      <GradientMesh>
        <div className="p-6 sm:p-10">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
            By the numbers
          </span>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="mt-4 grid grid-cols-3 gap-3 sm:gap-4"
          >
            {STATS.map((s) => (
              <motion.div
                key={s.label}
                variants={staggerItem}
                className="rounded-2xl border border-white/20 bg-white/10 p-4 text-center shadow-lg shadow-black/10 backdrop-blur-xl sm:p-6"
              >
                <div className="font-heading text-3xl font-bold text-white sm:text-4xl">{s.value}</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/70">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </GradientMesh>

      <div className="space-y-3">
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
          Why JobNeed
        </span>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-gray-950 dark:text-gray-50 sm:text-3xl">
          Compare it to <span className="text-indigo-600 dark:text-indigo-400">doing it yourself.</span>
        </h2>
        <FeatureComparison rows={COMPARISON} />
      </div>

      <div className="relative isolate space-y-3">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-4 -top-16 -z-10 h-16 w-16 text-indigo-500/70 dark:text-indigo-400/60"
          style={{
            backgroundImage: "radial-gradient(currentColor 2px, transparent 2px)",
            backgroundSize: "16px 16px",
          }}
        />
        <div className="pointer-events-none absolute -bottom-8 -right-8 -z-10 h-48 w-48 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 opacity-30 blur-2xl dark:opacity-40" />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-5 -top-9 -z-10 hidden h-20 w-20 rotate-12 rounded-2xl border-[6px] border-indigo-500/50 dark:border-indigo-400/50 sm:block"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-6 left-1/3 -z-10 hidden h-14 w-14 -rotate-6 rounded-full border-[6px] border-violet-500/40 dark:border-violet-400/40 md:block"
        />

        <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
          What's inside
        </span>
        <Slider slides={SLIDES} />
      </div>

      <div className="space-y-3">
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
          Gallery
        </span>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-gray-950 dark:text-gray-50 sm:text-3xl">
          Real work, <span className="text-indigo-600 dark:text-indigo-400">real teams.</span>
        </h2>
        <PhotoScroller photos={PHOTOS} />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm shadow-gray-900/[0.03] dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
        <p className="font-heading text-xl font-semibold text-gray-800 dark:text-gray-200">
          "Search once, prepare everywhere."
        </p>
        <Link
          to="/search"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/25 transition-transform hover:brightness-110 active:scale-[0.98]"
        >
          Start searching
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
