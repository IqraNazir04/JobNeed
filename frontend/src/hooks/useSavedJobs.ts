import { useCallback, useEffect, useState } from "react";
import {
  ApplicationStatus,
  getSavedJobsRemote,
  saveJobRemote,
  unsaveJobRemote,
  updateSavedJobStatusRemote,
  type Job,
} from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const STORAGE_KEY = "jobneed:saved-jobs";

interface SavedEntry {
  job: Job;
  status: ApplicationStatus;
}

function readLocal(): Record<string, SavedEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Job | SavedEntry>;
    const migrated: Record<string, SavedEntry> = {};
    for (const [id, value] of Object.entries(parsed)) {
      migrated[id] = "status" in value && "job" in value ? value : { job: value as Job, status: "saved" };
    }
    return migrated;
  } catch {
    return {};
  }
}

function writeLocal(saved: Record<string, SavedEntry>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // localStorage unavailable (private mode, quota) — saves silently no-op
  }
}

export function useSavedJobs() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [saved, setSaved] = useState<Record<string, SavedEntry>>(() => (user ? {} : readLocal()));

  // Signed in: load from the account. Signed out: load (or reload, after
  // logout) from this device's local copy.
  useEffect(() => {
    if (!user) {
      setSaved(readLocal());
      return;
    }
    getSavedJobsRemote()
      .then((entries) =>
        setSaved(Object.fromEntries(entries.map((e) => [e.job.id, { job: e.job, status: e.status }])))
      )
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
        else next[job.id] = { job, status: "saved" };
        return next;
      });
      showToast(wasSaved ? "Removed from saved" : "Saved job");
      if (user) {
        // Optimistic local update above; sync to the account in the
        // background. A failure here just means the next load reconciles.
        (wasSaved ? unsaveJobRemote(job.id) : saveJobRemote(job.id)).catch(() => {});
      }
    },
    [saved, user, showToast]
  );

  const updateStatus = useCallback(
    (jobId: string, status: ApplicationStatus) => {
      setSaved((prev) => (jobId in prev ? { ...prev, [jobId]: { ...prev[jobId], status } } : prev));
      if (user) {
        updateSavedJobStatusRemote(jobId, status).catch(() => {});
      }
    },
    [user]
  );

  return {
    savedJobs: Object.values(saved).sort((a, b) => a.job.title.localeCompare(b.job.title)),
    isSaved,
    toggleSaved,
    updateStatus,
  };
}
