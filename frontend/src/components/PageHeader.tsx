import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function PageHeader({
  kicker,
  title,
  emphasis,
  subtitle,
  action,
}: {
  kicker: string;
  title: string;
  emphasis?: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="space-y-4">
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3"
      >
        <span className="whitespace-nowrap font-mono text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
          {kicker}
        </span>
        <span className="h-px flex-1 bg-gray-300 dark:bg-gray-700" />
      </motion.div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="font-heading text-4xl font-extrabold leading-[1.08] tracking-tight text-gray-950 dark:text-gray-50 sm:text-5xl"
        >
          {title}
          {emphasis && (
            <>
              {" "}
              <span className="text-indigo-600 dark:text-indigo-400">{emphasis}</span>
            </>
          )}
        </motion.h1>
        {action}
      </div>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="max-w-xl text-base leading-relaxed text-gray-600 dark:text-gray-400"
        >
          {subtitle}
        </motion.p>
      )}
    </header>
  );
}
