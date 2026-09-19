import type { ReactNode } from "react";
import { ACCENTS, Accent } from "../lib/theme";

/**
 * Wraps one section of the one-pager in its own tinted, bordered panel with
 * a couple of soft accent-colored blobs behind it — so each of Home, Search,
 * Assistant, Tracker, CV, Interview, and Speaking reads as a distinct
 * "screen" while scrolling, rather than one undifferentiated column.
 */
export function SectionShell({ id, accent, children }: { id: string; accent: Accent; children: ReactNode }) {
  const theme = ACCENTS[accent];
  return (
    <section id={id} className="scroll-mt-28">
      <div className={`relative isolate overflow-hidden rounded-3xl border ${theme.border} ${theme.tint} p-5 sm:p-10`}>
        <div className={`pointer-events-none absolute -left-20 -top-20 -z-10 h-72 w-72 rounded-full ${theme.glow} opacity-[0.10] blur-3xl dark:opacity-[0.16]`} />
        <div className={`pointer-events-none absolute -right-16 -bottom-20 -z-10 h-64 w-64 rounded-full ${theme.glow} opacity-[0.08] blur-3xl dark:opacity-[0.12]`} />
        {children}
      </div>
    </section>
  );
}
