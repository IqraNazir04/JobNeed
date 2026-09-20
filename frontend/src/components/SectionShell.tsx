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
      {/* isolate/relative + border/tint live here, but NOT overflow-hidden -
          that would clip any descendant using position:sticky (the CV
          preview) or break a print target's position:fixed escape. */}
      <div className={`relative isolate rounded-3xl border ${theme.border} ${theme.tint} p-5 sm:p-10`}>
        {/* A separate absolutely-positioned layer clips just the blobs to
            the rounded corners, without wrapping the real content. */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl">
          <div className={`absolute -left-20 -top-20 h-72 w-72 rounded-full ${theme.glow} opacity-[0.10] blur-3xl dark:opacity-[0.16]`} />
          <div className={`absolute -right-16 -bottom-20 h-64 w-64 rounded-full ${theme.glow} opacity-[0.08] blur-3xl dark:opacity-[0.12]`} />
        </div>
        {children}
      </div>
    </section>
  );
}
