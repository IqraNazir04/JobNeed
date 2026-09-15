import type { ReactNode } from "react";

export function GradientMesh({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gray-950 shadow-2xl shadow-black/30 ${className}`}
    >
      <div className="absolute -left-20 -top-28 h-80 w-80 rounded-full bg-sky-500 opacity-30 blur-3xl" />
      <div className="absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-yellow-400 opacity-[0.18] blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_50%_0%,transparent_30%,rgba(3,7,18,0.65)_100%)]" />
      <div className="relative">{children}</div>
    </div>
  );
}
