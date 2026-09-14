import { useEffect } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";

export function NotFound() {
  usePageMeta("Page Not Found", "The page you're looking for doesn't exist.");

  useEffect(() => {
    const tag = document.createElement("meta");
    tag.name = "robots";
    tag.content = "noindex";
    document.head.appendChild(tag);
    return () => {
      document.head.removeChild(tag);
    };
  }, []);

  return (
    <div className="space-y-2 text-center">
      <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-50">Page not found</h1>
      <Link
        to="/"
        className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
      >
        ← Back home
      </Link>
    </div>
  );
}
