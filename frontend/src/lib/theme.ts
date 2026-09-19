export type Accent = "sky" | "emerald" | "violet" | "amber" | "rose" | "cyan" | "fuchsia";

/**
 * One accent per one-page section (Home, Search, Assistant, Tracker, CV,
 * Interview, Speaking) so each reads as its own "screen" while scrolling,
 * without touching the semantic colors used elsewhere (kanban status dots,
 * interview category badges, etc. keep their own meaning-carrying colors).
 * Every class string here is written out in full - Tailwind's scanner
 * needs the literal class name to appear in source, not just the runtime
 * key used to look it up.
 */
export const ACCENTS: Record<
  Accent,
  {
    text: string;
    badge: string;
    gradient: string;
    ring: string;
    glow: string;
    tint: string;
    border: string;
  }
> = {
  sky: {
    text: "text-sky-600 dark:text-sky-400",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
    gradient: "from-sky-600 to-blue-600",
    ring: "focus:ring-sky-500/40",
    glow: "bg-sky-400",
    tint: "bg-sky-50/60 dark:bg-sky-500/[0.04]",
    border: "border-sky-100 dark:border-sky-500/10",
  },
  emerald: {
    text: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    gradient: "from-emerald-600 to-teal-600",
    ring: "focus:ring-emerald-500/40",
    glow: "bg-emerald-400",
    tint: "bg-emerald-50/60 dark:bg-emerald-500/[0.04]",
    border: "border-emerald-100 dark:border-emerald-500/10",
  },
  violet: {
    text: "text-violet-600 dark:text-violet-400",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
    gradient: "from-violet-600 to-purple-600",
    ring: "focus:ring-violet-500/40",
    glow: "bg-violet-400",
    tint: "bg-violet-50/60 dark:bg-violet-500/[0.04]",
    border: "border-violet-100 dark:border-violet-500/10",
  },
  amber: {
    text: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    gradient: "from-amber-500 to-orange-600",
    ring: "focus:ring-amber-500/40",
    glow: "bg-amber-400",
    tint: "bg-amber-50/60 dark:bg-amber-500/[0.04]",
    border: "border-amber-100 dark:border-amber-500/10",
  },
  rose: {
    text: "text-rose-600 dark:text-rose-400",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
    gradient: "from-rose-600 to-pink-600",
    ring: "focus:ring-rose-500/40",
    glow: "bg-rose-400",
    tint: "bg-rose-50/60 dark:bg-rose-500/[0.04]",
    border: "border-rose-100 dark:border-rose-500/10",
  },
  cyan: {
    text: "text-cyan-600 dark:text-cyan-400",
    badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300",
    gradient: "from-cyan-600 to-sky-600",
    ring: "focus:ring-cyan-500/40",
    glow: "bg-cyan-400",
    tint: "bg-cyan-50/60 dark:bg-cyan-500/[0.04]",
    border: "border-cyan-100 dark:border-cyan-500/10",
  },
  fuchsia: {
    text: "text-fuchsia-600 dark:text-fuchsia-400",
    badge: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300",
    gradient: "from-fuchsia-600 to-pink-600",
    ring: "focus:ring-fuchsia-500/40",
    glow: "bg-fuchsia-400",
    tint: "bg-fuchsia-50/60 dark:bg-fuchsia-500/[0.04]",
    border: "border-fuchsia-100 dark:border-fuchsia-500/10",
  },
};
