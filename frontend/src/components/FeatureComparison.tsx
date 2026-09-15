export type ComparisonRow = {
  feature: string;
  without: string | boolean;
  withUs: string | boolean;
};

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 dark:text-emerald-400">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function Cross() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-gray-700">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function Cell({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return <div className="flex justify-center">{value ? <Check /> : <Cross />}</div>;
  }
  return <span>{value}</span>;
}

export function FeatureComparison({ rows }: { rows: ComparisonRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
      <table className="w-full table-fixed border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <th className="bg-white px-3 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-900 dark:text-gray-400 sm:px-5 sm:py-4 sm:text-xs">
              Feature
            </th>
            <th className="w-16 bg-white px-2 py-3 text-center font-mono text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:bg-gray-900 dark:text-gray-500 sm:w-40 sm:px-5 sm:py-4 sm:text-xs">
              Without<span className="hidden sm:inline"> JobNeed</span>
            </th>
            <th className="w-16 bg-sky-50 px-2 py-3 text-center font-mono text-[10px] font-semibold uppercase tracking-wide text-sky-600 dark:bg-sky-500/10 dark:text-sky-300 sm:w-40 sm:px-5 sm:py-4 sm:text-xs">
              With<span className="hidden sm:inline"> JobNeed</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.feature}
              className={`border-b border-gray-100 last:border-0 dark:border-gray-800/60 ${
                i % 2 === 1 ? "bg-gray-50/60 dark:bg-gray-900/40" : "bg-white dark:bg-gray-900"
              }`}
            >
              <td className="px-3 py-3 font-medium leading-snug text-gray-800 dark:text-gray-200 sm:px-5 sm:py-3.5">
                {row.feature}
              </td>
              <td className="px-2 py-3 text-center text-gray-400 dark:text-gray-500 sm:px-5 sm:py-3.5">
                <Cell value={row.without} />
              </td>
              <td className="bg-sky-50/50 px-2 py-3 text-center font-semibold text-gray-900 dark:bg-sky-500/[0.06] dark:text-gray-100 sm:px-5 sm:py-3.5">
                <Cell value={row.withUs} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
