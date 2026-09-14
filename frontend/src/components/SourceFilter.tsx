import { motion } from "framer-motion";

const SOURCE_LABEL_OVERRIDES: Record<string, string> = {
  linkedin: "LinkedIn",
  jobposting_schema: "Company Sites",
};

function formatSourceLabel(source: string): string {
  if (SOURCE_LABEL_OVERRIDES[source]) return SOURCE_LABEL_OVERRIDES[source];
  return source
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function SourceFilter({
  sources,
  active,
  onChange,
}: {
  sources: string[];
  active: string | null;
  onChange: (source: string | null) => void;
}) {
  if (sources.length === 0) return null;

  const options = [null, ...sources];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((source) => {
        const isActive = active === source;
        return (
          <motion.button
            key={source ?? "all"}
            onClick={() => onChange(source)}
            layout
            initial={false}
            whileTap={{ scale: 0.94 }}
            animate={isActive ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className={`relative rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              isActive ? "text-white" : "text-gray-600 dark:text-gray-400"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="active-source-pill"
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
                className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 shadow-sm shadow-indigo-600/25"
              />
            )}
            {!isActive && (
              <span className="absolute inset-0 rounded-full border border-gray-200 transition-colors hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600" />
            )}
            <span className="relative">{source ? formatSourceLabel(source) : "All sources"}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
