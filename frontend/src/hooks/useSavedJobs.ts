import { useCallback, useEffect, useState } from "react";
import { getSavedJobsRemote, saveJobRemote, unsaveJobRemote, type Job } from "../api/client";
import { useAuth } from "../context/AuthContext";

const STORAGE_KEY = "jobneed:saved-jobs";

function readLocal(): Record<string, Job> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLocal(saved: Record<string, Job>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // localStorage unavailable (private mode, quota) — saves silently no-op
  }
}

export function useSavedJobs() {
  const { user } = useAuth();
  const [saved, setSaved] = useState<Record<string, Job>>(() => (user ? {} : readLocal()));

  // Signed in: load from the account. Signed out: load (or reload, after
  // logout) from this device's local copy.
  useEffect(() => {
    if (!user) {
      setSaved(readLocal());
      return;
    }
    getSavedJobsRemote()
      .then((jobs) => setSaved(Object.fromEntries(jobs.map((j) => [j.id, j]))))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) writeLocal(saved);
  }, [saved, user]);

  const isSaved = useCallback((id: string) => id in saved, [saved]);

  const toggleSaved = useCallback(
    (job: Job) => {
      const wasSaved = job.id in saved;
      setSaved((prev) => {
        const next = { ...prev };
        if (wasSaved) delete next[job.id];
        else next[job.id] = job;
        return next;
      });
      if (user) {
        // Optimistic local update above; sync to the account in the
        // background. A failure here just means the next load reconciles.
        (wasSaved ? unsaveJobRemote(job.id) : saveJobRemote(job.id)).catch(() => {});
      }
    },
    [saved, user]
  );

  return {
    savedJobs: Object.values(saved).sort((a, b) => a.title.localeCompare(b.title)),
    isSaved,
    toggleSaved,
  };
}
