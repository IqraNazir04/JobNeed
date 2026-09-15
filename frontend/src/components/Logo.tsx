export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
      <circle cx="50" cy="35" r="16" stroke="currentColor" strokeWidth="13" />
      <path d="M20 83v-9a30 30 0 0 1 60 0v9" stroke="currentColor" strokeWidth="13" strokeLinecap="round" />
      <circle cx="79" cy="76" r="17" className="fill-paper dark:fill-paper-dark" stroke="currentColor" strokeWidth="5" />
      <rect x="69" y="70" width="20" height="13" rx="2" stroke="currentColor" strokeWidth="4" />
      <path d="M69 71l10 8 10-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({
  className = "",
  markClassName = "",
  wordmarkClassName = "",
}: {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className={`h-6 w-6 shrink-0 text-sky-600 dark:text-sky-400 ${markClassName}`} />
      <span className={`font-sans text-xl font-extrabold tracking-tight ${wordmarkClassName}`}>
        <span className="text-gray-950 dark:text-gray-50">Job</span>
        <span className="text-sky-600 dark:text-sky-400">Need</span>
      </span>
    </span>
  );
}
