import { useState } from "react";
import { JobDetailModal } from "../components/JobDetailModal";
import { useJobModal } from "../context/JobModalContext";
import { usePageMeta } from "../hooks/usePageMeta";
import { scrollToId } from "../lib/scroll";
import { About } from "./About";
import { Account } from "./Account";
import { Assistant } from "./Assistant";
import { CVBuilder } from "./CVBuilder";
import { Home } from "./Home";
import { InterviewPrep } from "./InterviewPrep";
import { SavedJobs } from "./SavedJobs";
import { SpeakingPractice } from "./SpeakingPractice";

function SectionDivider() {
  return <div className="my-14 h-px w-full bg-gray-200 dark:bg-gray-800" aria-hidden="true" />;
}

export function OnePage() {
  usePageMeta(
    "AI-Powered Job Search & Career Platform",
    "Search Greenhouse, Lever, LinkedIn, Upwork, Indeed, Google Jobs, Remote OK, Ashby, and Jobicy in one place. Tailor your CV, write cover letters, prep for interviews, and practice your spoken English — all powered by AI."
  );

  const { job, closeJob } = useJobModal();
  const [interviewJobId, setInterviewJobId] = useState<string | null>(null);
  const [speakingPrompt, setSpeakingPrompt] = useState<string | null>(null);

  return (
    <>
      <section id="home" className="scroll-mt-28">
        <About />
      </section>

      <SectionDivider />
      <section id="search" className="scroll-mt-28">
        <Home />
      </section>

      <SectionDivider />
      <section id="assistant" className="scroll-mt-28">
        <Assistant />
      </section>

      <SectionDivider />
      <section id="tracker" className="scroll-mt-28">
        <SavedJobs />
      </section>

      <SectionDivider />
      <section id="cv" className="scroll-mt-28">
        <CVBuilder />
      </section>

      <SectionDivider />
      <section id="interview" className="scroll-mt-28">
        <InterviewPrep
          prefillJobId={interviewJobId}
          onAskSpeaking={(question) => {
            setSpeakingPrompt(question);
            scrollToId("speaking");
          }}
        />
      </section>

      <SectionDivider />
      <section id="speaking" className="scroll-mt-28">
        <SpeakingPractice presetQuestion={speakingPrompt} />
      </section>

      <SectionDivider />
      <section id="account" className="scroll-mt-28">
        <Account />
      </section>

      <JobDetailModal
        job={job}
        onClose={closeJob}
        onPrepareInterview={(jobId) => {
          setInterviewJobId(jobId);
          closeJob();
          scrollToId("interview");
        }}
      />
    </>
  );
}
