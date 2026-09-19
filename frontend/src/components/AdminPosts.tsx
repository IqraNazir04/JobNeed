import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { BlogPost, createPost, deletePost, listPosts, updatePost, uploadBlogImage } from "../api/client";
import { useToast } from "../context/ToastContext";
import { isAuthError } from "../hooks/useAdminSession";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-sky-500/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500";
const labelClass = "text-xs font-semibold text-gray-500 dark:text-gray-400";
const buttonClass =
  "rounded-xl bg-gradient-to-br from-sky-600 to-yellow-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-sky-600/25 transition-transform hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

const EMPTY_FORM = { title: "", content: "", imageUrl: "", tags: "", published: false, scheduledFor: "" };

function tagList(tags: string): string[] {
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function postDateKey(post: BlogPost): string | null {
  const raw = post.scheduled_for || post.created_at;
  return raw ? raw.slice(0, 10) : null;
}

/** A minimal month grid — no date library — marking days that have a
 * scheduled or published post, so writers can see their content calendar
 * at a glance without leaving the panel. */
function ContentCalendar({ posts }: { posts: BlogPost[] }) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const postsByDay = useMemo(() => {
    const map = new Map<string, BlogPost[]>();
    for (const post of posts) {
      const key = postDateKey(post);
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(post);
    }
    return map;
  }, [posts]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="rounded-lg px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          ← Prev
        </button>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </p>
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="rounded-lg px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          Next →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-gray-400 dark:text-gray-600">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayPosts = postsByDay.get(key) ?? [];
          return (
            <div
              key={i}
              title={dayPosts.map((p) => p.title).join(", ")}
              className={`flex h-9 flex-col items-center justify-center rounded-lg text-xs ${
                dayPosts.length > 0
                  ? "bg-sky-100 font-semibold text-sky-700 dark:bg-sky-500/20 dark:text-sky-300"
                  : "text-gray-500 dark:text-gray-500"
              }`}
            >
              {day}
              {dayPosts.length > 0 && <span className="h-1 w-1 rounded-full bg-sky-500" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AdminPosts({ onLoggedOut }: { onLoggedOut: () => void }) {
  const { showToast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  async function handleImageFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { url } = await uploadBlogImage(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      if (isAuthError(err)) onLoggedOut();
      else setError(err instanceof Error ? err.message.split(" — ")[1] || "Couldn't upload that image." : "Couldn't upload that image.");
    } finally {
      setUploading(false);
    }
  }

  function insertHeading(level: 1 | 2 | 3) {
    const textarea = contentRef.current;
    const prefix = "#".repeat(level) + " ";
    if (!textarea) {
      setForm((f) => ({ ...f, content: prefix + f.content }));
      return;
    }
    const { selectionStart, selectionEnd, value } = textarea;
    const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
    const alreadyHeading = /^#{1,6} /.test(value.slice(lineStart));
    const insertion = alreadyHeading ? "" : prefix;
    const nextValue = value.slice(0, lineStart) + insertion + value.slice(lineStart);
    setForm((f) => ({ ...f, content: nextValue }));
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = selectionEnd + insertion.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function reload() {
    setLoading(true);
    listPosts()
      .then(setPosts)
      .catch((e) => {
        if (isAuthError(e)) onLoggedOut();
        else setError("Couldn't load posts right now.");
      })
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(reload, []);

  function startEdit(post: BlogPost) {
    setEditingId(post.id);
    setForm({
      title: post.title,
      content: post.content,
      imageUrl: post.image_url,
      tags: post.tags,
      published: post.published,
      scheduledFor: post.scheduled_for ? post.scheduled_for.slice(0, 16) : "",
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      image_url: form.imageUrl.trim(),
      tags: form.tags.trim(),
      published: form.published,
      scheduled_for: form.scheduledFor || null,
    };
    try {
      if (editingId) {
        await updatePost(editingId, payload);
        showToast("Post updated");
      } else {
        await createPost(payload);
        showToast("Post written");
      }
      resetForm();
      reload();
    } catch (e) {
      if (isAuthError(e)) onLoggedOut();
      else setError("Couldn't save this post right now.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(post: BlogPost) {
    if (!confirm(`Delete "${post.title}"?`)) return;
    try {
      await deletePost(post.id);
      showToast("Post deleted");
      reload();
    } catch (e) {
      if (isAuthError(e)) onLoggedOut();
      else setError("Couldn't delete this post right now.");
    }
  }

  return (
    <section className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div>
        <h2 className="font-bold text-gray-900 dark:text-gray-50">Write a post</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Draft, schedule, and publish posts. Scheduled posts show up on the content calendar below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className={labelClass}>Title</label>
          <input
            required
            className={inputClass}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className={labelClass}>Content</label>
            <div className="flex items-center gap-1">
              {([1, 2, 3] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => insertHeading(level)}
                  title={`Insert heading ${level}`}
                  className="rounded-md border border-gray-200 px-2 py-0.5 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  H{level}
                </button>
              ))}
            </div>
          </div>
          <textarea
            ref={contentRef}
            required
            rows={5}
            className={inputClass}
            placeholder="Write in Markdown — use the H1/H2/H3 buttons to add headings."
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Featured image (optional)</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://... or upload"
                className={inputClass}
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              />
              <label
                className={`shrink-0 cursor-pointer whitespace-nowrap rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 ${
                  uploading ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                {uploading ? "Uploading…" : "Upload"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  className="hidden"
                  disabled={uploading}
                  onChange={handleImageFile}
                />
              </label>
            </div>
          </div>
          <div>
            <label className={labelClass}>Tags (comma-separated, optional)</label>
            <input
              placeholder="e.g. career, remote-work"
              className={inputClass}
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </div>
        </div>
        {form.imageUrl && (
          <img
            src={form.imageUrl}
            alt=""
            className="h-32 w-full rounded-lg border border-gray-200 object-cover dark:border-gray-700"
            onError={(e) => (e.currentTarget.style.display = "none")}
            onLoad={(e) => (e.currentTarget.style.display = "block")}
          />
        )}
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <label className={labelClass}>Schedule for (optional)</label>
            <input
              type="datetime-local"
              className={inputClass}
              value={form.scheduledFor}
              onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500/40 dark:border-gray-700 dark:bg-gray-900"
            />
            Published
          </label>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className={buttonClass}>
            {saving ? "Saving…" : editingId ? "Update post" : "Publish post"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <div className="space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-600">
          Content calendar
        </h3>
        <ContentCalendar posts={posts} />
      </div>

      <div className="space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-600">
          All posts
        </h3>
        {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>}
        {!loading && posts.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Nothing written yet.</p>
        )}
        {posts.map((post) => (
          <div
            key={post.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2.5 dark:border-gray-800 dark:bg-gray-950/40"
          >
            <div className="flex min-w-0 items-center gap-3">
              {post.image_url && (
                <img
                  src={post.image_url}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{post.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {post.published ? "Published" : "Draft"}
                  {post.scheduled_for ? ` · scheduled ${new Date(post.scheduled_for).toLocaleString()}` : ""}
                </p>
                {tagList(post.tags).length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {tagList(post.tags).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:bg-sky-500/20 dark:text-sky-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                onClick={() => startEdit(post)}
                className="text-xs font-semibold text-sky-600 hover:underline dark:text-sky-400"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(post)}
                className="text-xs font-semibold text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
