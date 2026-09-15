import { useMemo } from "react";

const QUOTES = [
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "The only way to do great work is to love what you do. If you haven't found it yet, keep looking.", author: "Steve Jobs" },
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "It's not whether you get knocked down, it's whether you get up.", author: "Vince Lombardi" },
  { text: "Perseverance is not a long race; it is many short races one after another.", author: "Walter Elliot" },
  { text: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { text: "Our greatest glory is not in never falling, but in rising every time we fall.", author: "Confucius" },
];

export function MotivationalQuote({ className = "" }: { className?: string }) {
  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);

  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-sky-300 dark:text-sky-500/40"
      >
        <path d="M9.5 7C7 7 5 9 5 11.5S7 16 9.5 16c0 2-1.5 3.5-3.5 3.5v1.5c3.5 0 6-2.5 6-6V11c0-2.2-1.8-4-4-4h1.5zM18 7c-2.5 0-4.5 2-4.5 4.5S15.5 16 18 16c0 2-1.5 3.5-3.5 3.5v1.5c3.5 0 6-2.5 6-6V11c0-2.2-1.8-4-4-4H18z" />
      </svg>
      <p className="mt-2 font-heading text-base font-semibold leading-snug text-gray-800 dark:text-gray-200">
        {quote.text}
      </p>
      <p className="mt-3 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-sky-600 dark:text-sky-400">
        — {quote.author}
      </p>
    </div>
  );
}
