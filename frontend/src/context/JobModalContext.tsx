import { createContext, ReactNode, useContext, useState } from "react";
import type { Job } from "../api/client";

type JobModalState = {
  job: Job | null;
  openJob: (job: Job) => void;
  closeJob: () => void;
};

const JobModalContext = createContext<JobModalState | null>(null);

export function JobModalProvider({ children }: { children: ReactNode }) {
  const [job, setJob] = useState<Job | null>(null);
  return (
    <JobModalContext.Provider value={{ job, openJob: setJob, closeJob: () => setJob(null) }}>
      {children}
    </JobModalContext.Provider>
  );
}

export function useJobModal() {
  const ctx = useContext(JobModalContext);
  if (!ctx) throw new Error("useJobModal must be used within a JobModalProvider");
  return ctx;
}
