import { motion } from "framer-motion";
import { useMemo } from "react";

const COLORS = ["#4F46E5", "#7C3AED", "#EC4899", "#F59E0B", "#10B981", "#06B6D4"];

function makeParticles() {
  return Array.from({ length: 18 }, (_, i) => {
    const angle = (i / 18) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const distance = 34 + Math.random() * 42;
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 8,
      rotate: Math.random() * 360,
      color: COLORS[i % COLORS.length],
      size: 5 + Math.random() * 4,
    };
  });
}

export function ConfettiBurst({ burstKey }: { burstKey: number }) {
  const particles = useMemo(() => makeParticles(), [burstKey]);

  if (burstKey <= 0) return null;

  return (
    <motion.div
      key={burstKey}
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.4, rotate: p.rotate }}
          transition={{ duration: 0.75, ease: "easeOut" }}
          className="absolute rounded-sm"
          style={{ backgroundColor: p.color, width: p.size, height: p.size }}
        />
      ))}
    </motion.div>
  );
}
