import type { ReactNode } from "react";

export function GradientMesh({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gray-950 ${className}`}>
      <div className="absolute -left-16 -top-20 h-72 w-72 rounded-full bg-indigo-500 opacity-70 blur-3xl" />
      <div className="absolute -right-10 -top-24 h-64 w-64 rounded-full bg-violet-500 opacity-60 blur-3xl" />
      <div className="absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-fuchsia-500 opacity-40 blur-3xl" />
      <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-cyan-400 opacity-40 blur-3xl" />
      <div className="relative">{children}</div>
    </div>
  );
}
