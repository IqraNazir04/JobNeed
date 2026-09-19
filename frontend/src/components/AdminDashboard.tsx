import { useEffect, useState } from "react";
import { AdminDashboard as AdminDashboardData, ChartSeriesPoint, getAdminDashboard, getAdminDashboardChart } from "../api/client";
import { isAuthError } from "../hooks/useAdminSession";

function ActivityChart({ series }: { series: ChartSeriesPoint[] }) {
  const width = 560;
  const height = 160;
  const padding = 24;
  const max = Math.max(1, ...series.map((p) => Math.max(p.jobs_posted, p.user_signups)));
  const barGroupWidth = (width - padding * 2) / series.length;

  function y(value: number) {
    return height - padding - (value / max) * (height - padding * 2);
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full" role="img" aria-label="Jobs posted and user signups over the last 14 days">
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" className="text-gray-200 dark:text-gray-700" />
      {series.map((point, i) => {
        const groupX = padding + i * barGroupWidth;
        const barWidth = Math.max(2, barGroupWidth * 0.28);
        return (
          <g key={point.date}>
            <rect
              x={groupX + barGroupWidth * 0.18}
              y={y(point.jobs_posted)}
              width={barWidth}
              height={height - padding - y(point.jobs_posted)}
              className="fill-sky-500"
              rx={1.5}
            >
              <title>{`${point.date}: ${point.jobs_posted} job(s) posted`}</title>
            </rect>
            <rect
              x={groupX + barGroupWidth * 0.54}
              y={y(point.user_signups)}
              width={barWidth}
              height={height - padding - y(point.user_signups)}
              className="fill-yellow-500"
              rx={1.5}
            >
              <title>{`${point.date}: ${point.user_signups} signup(s)`}</title>
            </rect>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Read-only, at-a-glance view — available to editors too, since nothing
 * here lets you change anything. Loads the aggregate counts and the
 * 14-day chart in parallel; either can fail independently without
 * blocking the other from rendering.
 */
export function AdminDashboard({ onLoggedOut }: { onLoggedOut: () => void }) {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [series, setSeries] = useState<ChartSeriesPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminDashboard()
      .then(setData)
      .catch((e) => {
        if (isAuthError(e)) onLoggedOut();
        else setError("Couldn't load the dashboard right now.");
      });
    getAdminDashboardChart()
      .then((res) => setSeries(res.series))
      .catch((e) => {
        if (isAuthError(e)) onLoggedOut();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="space-y-4">
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Jobs indexed", value: data.total_jobs_indexed },
            { label: "Active board postings", value: data.active_board_postings },
            { label: "Users", value: data.total_users },
            { label: "Admins", value: data.total_admins },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-3 dark:border-gray-800 dark:bg-gray-950/40"
            >
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {series && (
        <div className="space-y-2 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sky-500" /> Jobs posted
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-yellow-500" /> User signups
            </span>
            <span className="ml-auto text-gray-400">Last 14 days</span>
          </div>
          <ActivityChart series={series} />
        </div>
      )}

      {data && (
        <div className="space-y-2 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-600">
            Recent activity
          </h3>
          {data.recent_activity.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">Nothing yet.</p>
          )}
          <ul className="space-y-1.5">
            {data.recent_activity.map((item, i) => (
              <li key={i} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-gray-700 dark:text-gray-300">
                  {item.type === "job_posted" ? "📌 " : "👤 "}
                  {item.label}
                </span>
                <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                  {new Date(item.timestamp).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
