import { FormEvent, useState } from "react";

export function SearchBar({
  onSearch,
  placeholder = "e.g. remote React contract under 3 months",
  submitLabel = "Search",
}: {
  onSearch: (query: string) => void;
  placeholder?: string;
  submitLabel?: string;
}) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (value.trim()) onSearch(value.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2.5">
      <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 transition-shadow focus-within:border-transparent focus-within:ring-2 focus-within:ring-sky-500/40 dark:border-gray-700 dark:bg-gray-900">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gray-400 dark:text-gray-500">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="h-11 flex-1 border-none bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
        />
      </div>
      <button
        type="submit"
        className="whitespace-nowrap rounded-xl bg-gradient-to-br from-sky-600 to-yellow-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-sky-600/25 transition-transform hover:brightness-110 active:scale-[0.98]"
      >
        {submitLabel}
      </button>
    </form>
  );
}
