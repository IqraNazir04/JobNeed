import type { CVFormData } from "../hooks/useCV";

export function CVPreview({ cv }: { cv: CVFormData }) {
  const hasContactLine = cv.email || cv.phone || cv.location || cv.links;

  return (
    <div id="cv-print-area" className="rounded-2xl border border-gray-200 bg-white p-8 text-gray-900 shadow-sm shadow-gray-900/[0.03] dark:border-gray-800 print:rounded-none print:border-none print:p-0 print:shadow-none">
      <h2 className="text-2xl font-extrabold tracking-tight">{cv.name || "Your Name"}</h2>
      {hasContactLine && (
        <p className="mt-1 text-sm text-gray-600">
          {[cv.email, cv.phone, cv.location, cv.links].filter(Boolean).join(" · ")}
        </p>
      )}

      {cv.summary && (
        <section className="mt-5">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500">Summary</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-800">{cv.summary}</p>
        </section>
      )}

      {cv.experience.length > 0 && (
        <section className="mt-5">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500">Experience</h2>
          <div className="mt-1.5 space-y-3.5">
            {cv.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="text-sm font-semibold text-gray-900">
                    {exp.title || "Title"} {exp.company && `· ${exp.company}`}
                  </span>
                  {exp.dates && <span className="text-xs text-gray-500">{exp.dates}</span>}
                </div>
                {exp.bullets.filter(Boolean).length > 0 && (
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-gray-800">
                    {exp.bullets.filter(Boolean).map((bullet, i) => (
                      <li key={i}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {cv.education.length > 0 && (
        <section className="mt-5">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500">Education</h2>
          <div className="mt-1.5 space-y-2">
            {cv.education.map((edu) => (
              <div key={edu.id} className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-sm font-semibold text-gray-900">
                  {edu.degree || "Degree"} {edu.school && `· ${edu.school}`}
                </span>
                {edu.dates && <span className="text-xs text-gray-500">{edu.dates}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {cv.skills.length > 0 && (
        <section className="mt-5">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500">Skills</h2>
          <p className="mt-1.5 text-sm text-gray-800">{cv.skills.join(" · ")}</p>
        </section>
      )}
    </div>
  );
}
