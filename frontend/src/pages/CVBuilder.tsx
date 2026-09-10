import { useState } from "react";
import { tailorCV, TailorCVResponse } from "../api/client";
import { CVPreview } from "../components/CVPreview";
import { useAuth } from "../context/AuthContext";
import { useCV } from "../hooks/useCV";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500";
const labelClass = "text-xs font-semibold text-gray-500 dark:text-gray-400";

export function CVBuilder() {
  const {
    cv,
    update,
    addExperience,
    updateExperience,
    removeExperience,
    addEducation,
    updateEducation,
    removeEducation,
  } = useCV();
  const { user } = useAuth();

  const [jobDescription, setJobDescription] = useState("");
  const [tailoring, setTailoring] = useState(false);
  const [tailorError, setTailorError] = useState<string | null>(null);
  const [tailorResult, setTailorResult] = useState<TailorCVResponse | null>(null);

  async function handleTailor() {
    if (!jobDescription.trim()) return;
    setTailoring(true);
    setTailorError(null);
    setTailorResult(null);
    try {
      const backendCV = {
        ...cv,
        experience: cv.experience.map(({ id: _id, ...rest }) => rest),
        education: cv.education.map(({ id: _id, ...rest }) => rest),
      };
      setTailorResult(await tailorCV(backendCV, jobDescription));
    } catch (e) {
      setTailorError(e instanceof Error ? e.message : "Couldn't tailor your CV right now.");
    } finally {
      setTailoring(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <header className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
            Make Your CV
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Build your CV, then tailor it to a specific job with AI.{" "}
            {user ? "Synced to your account." : "Saved on this device only — log in to sync it."}
          </p>
        </header>
        <button
          onClick={() => window.print()}
          className="whitespace-nowrap rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-indigo-600/25 transition-transform hover:brightness-110"
        >
          Print / Save as PDF
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5 print:hidden">
          <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="font-bold text-gray-900 dark:text-gray-50">Contact</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={inputClass} placeholder="Full name" value={cv.name} onChange={(e) => update({ name: e.target.value })} />
              <input className={inputClass} placeholder="Email" value={cv.email} onChange={(e) => update({ email: e.target.value })} />
              <input className={inputClass} placeholder="Phone" value={cv.phone} onChange={(e) => update({ phone: e.target.value })} />
              <input className={inputClass} placeholder="Location" value={cv.location} onChange={(e) => update({ location: e.target.value })} />
              <input className={`${inputClass} sm:col-span-2`} placeholder="LinkedIn / portfolio link" value={cv.links} onChange={(e) => update({ links: e.target.value })} />
            </div>
          </section>

          <section className="space-y-2 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="font-bold text-gray-900 dark:text-gray-50">Summary</h2>
            <textarea
              className={inputClass}
              rows={3}
              placeholder="A 2-3 sentence professional summary"
              value={cv.summary}
              onChange={(e) => update({ summary: e.target.value })}
            />
          </section>

          <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 dark:text-gray-50">Experience</h2>
              <button onClick={addExperience} className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                + Add role
              </button>
            </div>
            {cv.experience.map((exp) => (
              <div key={exp.id} className="space-y-2 rounded-xl border border-gray-100 p-3 dark:border-gray-800">
                <div className="grid gap-2 sm:grid-cols-2">
                  <input className={inputClass} placeholder="Job title" value={exp.title} onChange={(e) => updateExperience(exp.id, { title: e.target.value })} />
                  <input className={inputClass} placeholder="Company" value={exp.company} onChange={(e) => updateExperience(exp.id, { company: e.target.value })} />
                </div>
                <input className={inputClass} placeholder="Dates (e.g. 2022 - Present)" value={exp.dates} onChange={(e) => updateExperience(exp.id, { dates: e.target.value })} />
                <textarea
                  className={inputClass}
                  rows={3}
                  placeholder="One achievement per line"
                  value={exp.bullets.join("\n")}
                  onChange={(e) => updateExperience(exp.id, { bullets: e.target.value.split("\n") })}
                />
                <button onClick={() => removeExperience(exp.id)} className="text-xs font-medium text-gray-400 hover:text-red-500">
                  Remove
                </button>
              </div>
            ))}
          </section>

          <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 dark:text-gray-50">Education</h2>
              <button onClick={addEducation} className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                + Add school
              </button>
            </div>
            {cv.education.map((edu) => (
              <div key={edu.id} className="space-y-2 rounded-xl border border-gray-100 p-3 dark:border-gray-800">
                <div className="grid gap-2 sm:grid-cols-2">
                  <input className={inputClass} placeholder="Degree" value={edu.degree} onChange={(e) => updateEducation(edu.id, { degree: e.target.value })} />
                  <input className={inputClass} placeholder="School" value={edu.school} onChange={(e) => updateEducation(edu.id, { school: e.target.value })} />
                </div>
                <input className={inputClass} placeholder="Dates" value={edu.dates} onChange={(e) => updateEducation(edu.id, { dates: e.target.value })} />
                <button onClick={() => removeEducation(edu.id)} className="text-xs font-medium text-gray-400 hover:text-red-500">
                  Remove
                </button>
              </div>
            ))}
          </section>

          <section className="space-y-2 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="font-bold text-gray-900 dark:text-gray-50">Skills</h2>
            <label className={labelClass}>Comma-separated</label>
            <input
              className={inputClass}
              placeholder="Python, SQL, Project Management"
              value={cv.skills.join(", ")}
              onChange={(e) => update({ skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
            />
          </section>

          <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="font-bold text-gray-900 dark:text-gray-50">Tailor for a job</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Paste a job description and Claude will suggest a tailored summary and which of your
              skills to lead with.
            </p>
            <textarea
              className={inputClass}
              rows={4}
              placeholder="Paste the job description here"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
            <button
              onClick={handleTailor}
              disabled={tailoring || !jobDescription.trim()}
              className="rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-indigo-600/25 transition-transform hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {tailoring ? "Tailoring…" : "Tailor with AI"}
            </button>

            {tailorError && <p className="text-sm text-red-600 dark:text-red-400">{tailorError}</p>}

            {tailorResult && (
              <div className="space-y-3 rounded-xl bg-gray-100 p-4 dark:bg-gray-800/60">
                <div>
                  <p className={labelClass}>Suggested summary</p>
                  <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">{tailorResult.tailored_summary}</p>
                  <button
                    onClick={() => update({ summary: tailorResult.tailored_summary })}
                    className="mt-1.5 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Apply to CV
                  </button>
                </div>
                <div>
                  <p className={labelClass}>Skills to lead with</p>
                  <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                    {tailorResult.emphasized_skills.join(", ")}
                  </p>
                  <button
                    onClick={() => update({ skills: tailorResult.emphasized_skills })}
                    className="mt-1.5 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Apply to CV
                  </button>
                </div>
                <p className="text-xs italic text-gray-500 dark:text-gray-400">{tailorResult.notes}</p>
              </div>
            )}
          </section>
        </div>

        <div className="lg:sticky lg:top-8 lg:self-start">
          <CVPreview cv={cv} />
        </div>
      </div>
    </div>
  );
}
