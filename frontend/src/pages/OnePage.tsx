import { useState } from "react";
import { JobDetailModal } from "../components/JobDetailModal";
import { SectionShell } from "../components/SectionShell";
import { useJobModal } from "../context/JobModalContext";
import { usePageMeta } from "../hooks/usePageMeta";
import { scrollToId } from "../lib/scroll";
import { About } from "./About";
import { Assistant } from "./Assistant";
import { CVBuilder } from "./CVBuilder";
import { Home } from "./Home";
import { InterviewPrep } from "./InterviewPrep";
import { SavedJobs } from "./SavedJobs";
import { SpeakingPractice } from "./SpeakingPractice";

export function OnePage() {
  usePageMeta(
    "AI-Powered Job Search & Career Platform",
    "Search Greenhouse, Lever, LinkedIn, Upwork, Indeed, Google Jobs, Remote OK, Ashby, and Jobicy in one place. Tailor your CV, write cover letters, prep for interviews, and practice your spoken English — all powered by AI."
  );

  const { job, closeJob } = useJobModal();
  const [interviewJobId, setInterviewJobId] = useState<string | null>(null);
  const [speakingPrompt, setSpeakingPrompt] = useState<string | null>(null);

  return (
    <div className="space-y-14 sm:space-y-20">
      <SectionShell id="home" accent="sky">
        <About />
      </SectionShell>

      <SectionShell id="search" accent="emerald">
        <Home />
      </SectionShell>

      <SectionShell id="assistant" accent="violet">
        <Assistant />
      </SectionShell>

      <SectionShell id="tracker" accent="amber">
        <SavedJobs />
      </SectionShell>

      <SectionShell id="cv" accent="rose">
        <CVBuilder />
      </SectionShell>

      <SectionShell id="interview" accent="cyan">
        <InterviewPrep
          prefillJobId={interviewJobId}
          onAskSpeaking={(question) => {
            setSpeakingPrompt(question);
            scrollToId("speaking");
          }}
        />
      </SectionShell>

      <SectionShell id="speaking" accent="fuchsia">
        <SpeakingPractice presetQuestion={speakingPrompt} />
      </SectionShell>

      <JobDetailModal
        job={job}
        onClose={closeJob}
        onPrepareInterview={(jobId) => {
          setInterviewJobId(jobId);
          closeJob();
          scrollToId("interview");
        }}
      />
    </div>
  );
}
