import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="space-y-2 text-center">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Page not found</h1>
      <Link
        to="/"
        className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
      >
        ← Back to search
      </Link>
    </div>
  );
}
