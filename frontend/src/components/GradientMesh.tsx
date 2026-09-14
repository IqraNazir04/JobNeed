import type { ReactNode } from "react";

export function GradientMesh({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gray-950 ${className}`}>
      <div className="absolute -left-16 -top-24 h-80 w-80 rounded-full bg-indigo-600 opacity-40 blur-3xl" />
      <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-blue-700 opacity-30 blur-3xl" />
      <div className="relative">{children}</div>
    </div>
  );
}
