import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

export type Slide = {
  kicker: string;
  title: string;
  description: string;
  icon?: ReactNode;
};

const AUTOPLAY_MS = 6000;

export function Slider({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, slides.length]);

  function go(next: number) {
    setDirection(next > index || (index === slides.length - 1 && next === 0) ? 1 : -1);
    setIndex((next + slides.length) % slides.length);
  }

  const slide = slides[index];

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-900/[0.03] dark:border-gray-800 dark:bg-gray-900 dark:shadow-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-64 px-11 py-10 sm:h-48 sm:px-14">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={index}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -40 : 40 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute inset-0 flex items-center gap-5 px-11 sm:px-14"
          >
            {slide.icon && (
              <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-yellow-600 text-white shadow-md shadow-sky-600/25 sm:flex">
                {slide.icon}
              </div>
            )}
            <div>
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">
                {slide.kicker}
              </span>
              <h3 className="mt-2 font-heading text-2xl font-bold tracking-tight text-gray-950 dark:text-gray-50 sm:text-3xl">
                {slide.title}
              </h3>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {slide.description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <button
        onClick={() => go(index - 1)}
        aria-label="Previous"
        className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/90 text-gray-600 shadow-sm transition-colors hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-400 dark:hover:border-gray-600"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        onClick={() => go(index + 1)}
        aria-label="Next"
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/90 text-gray-600 shadow-sm transition-colors hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-400 dark:hover:border-gray-600"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      <div className="flex items-center justify-center gap-1.5 border-t border-gray-100 py-3 dark:border-gray-800">
        {slides.map((s, i) => (
          <button
            key={s.title}
            onClick={() => go(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-6 bg-sky-600 dark:bg-sky-400" : "w-1.5 bg-gray-300 dark:bg-gray-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
