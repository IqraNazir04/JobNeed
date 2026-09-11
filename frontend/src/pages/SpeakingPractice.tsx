import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getSpeakingFeedback, SpeakingFeedbackResponse } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { staggerContainer, staggerItem } from "../components/PageTransition";

const QUESTION_BANK = [
  "Tell me about yourself.",
  "Why do you want to work here?",
  "What is your greatest strength?",
  "What is your greatest weakness?",
  "Describe a challenge you faced at work and how you handled it.",
  "Where do you see yourself in five years?",
  "Why are you leaving your current job?",
  "Tell me about a time you worked in a team.",
  "How do you handle stress or pressure?",
  "Do you have any questions for us?",
];

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500";

// Web Speech API isn't in the standard DOM lib types.
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function SpeakingPractice() {
  const [searchParams] = useSearchParams();
  const presetQuestion = searchParams.get("q");
  const [questionIndex, setQuestionIndex] = useState(0);
  const question = presetQuestion || QUESTION_BANK[questionIndex];

  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<SpeakingFeedbackResponse | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const supportsSpeechRecognition = !!getSpeechRecognitionCtor();
  const supportsSpeechSynthesis = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  function speakQuestion() {
    if (!supportsSpeechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(question);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }

  function startRecording() {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript;
      }
      if (finalText) setTranscript((prev) => (prev ? `${prev} ${finalText}`.trim() : finalText.trim()));
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }

  async function handleGetFeedback() {
    setLoading(true);
    setError(null);
    setFeedback(null);
    try {
      setFeedback(await getSpeakingFeedback(question, transcript));
    } catch (e) {
      setError(
        e instanceof Error && e.message.includes("422")
          ? "No speech was captured — try recording or typing your answer first."
          : "Couldn't get feedback right now."
      );
    } finally {
      setLoading(false);
    }
  }

  function nextQuestion() {
    setQuestionIndex((i) => (i + 1) % QUESTION_BANK.length);
    setTranscript("");
    setFeedback(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          kicker="Speaking Practice"
          title="Sound more"
          emphasis="fluent."
          subtitle="Answer out loud, and get feedback on your English — grammar, fluency, filler words, and phrasing — not just what you said."
        />
        <motion.img
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          src="https://images.unsplash.com/photo-1616001089004-04948fc0e6c1?auto=format&fit=crop&w=800&q=80"
          alt=""
          className="hidden h-44 w-full rounded-2xl object-cover shadow-lg shadow-gray-900/10 sm:block lg:h-40 lg:w-80 lg:shrink-0"
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start justify-between gap-3">
          <p className="font-serif text-xl italic leading-snug text-gray-900 dark:text-gray-50">
            “{question}”
          </p>
          {!presetQuestion && (
            <button
              onClick={nextQuestion}
              className="shrink-0 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Next question
            </button>
          )}
        </div>

        {supportsSpeechSynthesis && (
          <button
            onClick={speakQuestion}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5 6 9H2v6h4l5 4V5z" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
            Hear the question
          </button>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {supportsSpeechRecognition ? (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white shadow-md transition-transform hover:brightness-110 active:scale-[0.98] ${
                isRecording
                  ? "bg-red-600 shadow-red-600/25"
                  : "bg-gradient-to-br from-indigo-600 to-violet-600 shadow-indigo-600/25"
              }`}
            >
              {isRecording && (
                <motion.span
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  className="flex h-2.5 w-2.5 rounded-full bg-white"
                />
              )}
              {!isRecording && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="7" />
                </svg>
              )}
              {isRecording ? "Stop recording" : "Start recording"}
            </button>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Voice recording isn't supported in this browser — try Chrome, or type your answer
              below.
            </p>
          )}
          <AnimatePresence>
            {isRecording && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs font-semibold text-red-600 dark:text-red-400"
              >
                Listening…
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <textarea
          rows={4}
          className={`${inputClass} mt-3`}
          placeholder="Your answer will appear here as you speak — or type it directly."
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
        />

        <button
          onClick={handleGetFeedback}
          disabled={!transcript.trim() || loading}
          className="mt-3 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-indigo-600/25 transition-transform hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Analyzing…" : "Get feedback"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {feedback && (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4">
          <motion.div
            variants={staggerItem}
            className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-xl font-extrabold text-white shadow-md shadow-indigo-600/25"
            >
              {feedback.overall_score}/10
            </motion.div>
            <div>
              <p className="font-bold text-gray-900 dark:text-gray-50">Fluency &amp; clarity score</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {feedback.filler_word_count} filler word{feedback.filler_word_count === 1 ? "" : "s"}{" "}
                detected
              </p>
            </div>
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <h2 className="font-bold text-gray-900 dark:text-gray-50">What you did well</h2>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-gray-700 dark:text-gray-300">
              {feedback.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </motion.div>

          {feedback.grammar_notes.length > 0 && (
            <motion.div
              variants={staggerItem}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
            >
              <h2 className="font-bold text-gray-900 dark:text-gray-50">Grammar notes</h2>
              <div className="mt-2 space-y-3">
                {feedback.grammar_notes.map((note, i) => (
                  <div key={i} className="text-sm">
                    <p className="text-gray-500 line-through dark:text-gray-500">{note.original}</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-50">{note.suggestion}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{note.explanation}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {feedback.vocabulary_suggestions.length > 0 && (
            <motion.div
              variants={staggerItem}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
            >
              <h2 className="font-bold text-gray-900 dark:text-gray-50">Sound more natural</h2>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-gray-700 dark:text-gray-300">
                {feedback.vocabulary_suggestions.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </motion.div>
          )}

          <motion.div
            variants={staggerItem}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <h2 className="font-bold text-gray-900 dark:text-gray-50">A more polished version</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {feedback.improved_answer}
            </p>
          </motion.div>
        </motion.div>
      )}

      {!feedback && !loading && !error && (
        <EmptyState
          title="Ready when you are"
          description="Record or type your answer above, then get feedback on your English."
        />
      )}
    </div>
  );
}
