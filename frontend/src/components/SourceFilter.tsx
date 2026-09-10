export function SourceFilter({
  sources,
  active,
  onChange,
}: {
  sources: string[];
  active: string | null;
  onChange: (source: string | null) => void;
}) {
  if (sources.length <= 1) return null;

  const base = "rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors";
  const activeClass = "bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-600/25";
  const inactiveClass =
    "border border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600";

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(null)}
        className={`${base} ${active === null ? activeClass : inactiveClass}`}
      >
        All sources
      </button>
      {sources.map((source) => (
        <button
          key={source}
          onClick={() => onChange(source)}
          className={`${base} ${active === source ? activeClass : inactiveClass}`}
        >
          {source}
        </button>
      ))}
    </div>
  );
}
