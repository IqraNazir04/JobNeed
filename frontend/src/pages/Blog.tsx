import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { BlogPost, getPublicBlogPosts } from "../api/client";
import { Logo } from "../components/Logo";
import { useDarkMode } from "../hooks/useDarkMode";
import { usePageMeta } from "../hooks/usePageMeta";

function tagList(tags: string): string[] {
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function excerpt(content: string): string {
  const plain = content.replace(/^#{1,6}\s+/gm, "").replace(/[*_[\]()]/g, "");
  return plain.length > 180 ? `${plain.slice(0, 180)}…` : plain;
}

/**
 * A public, unauthenticated page — deliberately its own route rather than a
 * section of the one-pager, the same way /admin is, since posts need their
 * own shareable, linkable URLs.
 */
export function Blog() {
  usePageMeta("Blog", "Career advice, product updates, and news from JobNeed.");
  const { dark, toggleDark } = useDarkMode();
  const [posts, setPosts] = useState<BlogPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPublicBlogPosts()
      .then(setPosts)
      .catch(() => setError("Couldn't load posts right now."));
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-paper dark:bg-paper-dark">
      <header className="border-b-[3px] border-double border-gray-900 bg-gray-100/90 backdrop-blur-lg dark:border-gray-100 dark:bg-gray-900/90">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center">
            <Logo markClassName="h-7 w-7" wordmarkClassName="hidden sm:inline" />
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDark}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-gray-200 text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              {dark ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
            <Link
              to="/"
              className="whitespace-nowrap rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 sm:text-sm"
            >
              ← Back to JobNeed
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-8">
        <div className="space-y-1">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">
            Blog
          </span>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-gray-950 dark:text-gray-50">
            From the JobNeed team
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Career advice, product updates, and news.
          </p>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {posts === null && !error && <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>}
        {posts?.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No posts yet — check back soon.</p>}

        <div className="space-y-4">
          {posts?.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.id}`}
              className="block overflow-hidden rounded-2xl border border-gray-200 bg-white transition-shadow hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
            >
              {post.image_url && (
                <img src={post.image_url} alt="" className="h-48 w-full object-cover" />
              )}
              <div className="space-y-2 p-5">
                <h2 className="font-heading text-xl font-bold text-gray-900 dark:text-gray-50">{post.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{excerpt(post.content)}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(post.scheduled_for || post.created_at).toLocaleDateString()}
                  </span>
                  {tagList(post.tags).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:bg-sky-500/20 dark:text-sky-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
