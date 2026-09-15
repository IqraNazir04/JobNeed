const ITEMS = [
  "Greenhouse",
  "Lever",
  "LinkedIn",
  "Upwork",
  "Indeed",
  "Google Jobs",
  "Remote OK",
  "AI-powered search",
  "Built with Claude",
];

export function Marquee() {
  const line = ITEMS.join("   ·   ");
  return (
    <div className="overflow-hidden border-b border-gray-900 bg-gray-950 py-2 dark:border-gray-100 dark:bg-gray-100">
      <div className="flex w-max animate-marquee">
        {[0, 1].map((i) => (
          <span
            key={i}
            className="whitespace-nowrap px-4 font-mono text-xs font-semibold uppercase tracking-[0.15em] text-paper dark:text-gray-900"
          >
            {line}   ·   {line}
          </span>
        ))}
      </div>
    </div>
  );
}
