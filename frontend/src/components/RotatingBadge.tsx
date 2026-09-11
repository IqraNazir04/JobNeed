import { motion } from "framer-motion";

export function RotatingBadge({
  text = "AI-POWERED · REAL JOBS · RANKED BY FIT · ",
  size = 96,
  className = "",
}: {
  text?: string;
  size?: number;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <motion.svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      >
        <defs>
          <path id="badge-ring" d="M 50,50 m -40,0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0" />
          <linearGradient id="badge-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <text
          className="fill-gray-900 dark:fill-gray-100"
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "7.5px", fontWeight: 600, letterSpacing: "0.5px" }}
        >
          <textPath href="#badge-ring" startOffset="0%">
            {text.repeat(2)}
          </textPath>
        </text>
        <circle cx="50" cy="50" r="17" fill="url(#badge-gradient)" />
      </motion.svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
        </svg>
      </div>
    </div>
  );
}
