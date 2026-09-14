/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["'Inter'", "'Plus Jakarta Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        paper: {
          DEFAULT: "#f7f1e7",
          dark: "#0c0a08",
        },
      },
      animation: {
        marquee: "marquee 22s linear infinite",
        "spin-slow": "spin 12s linear infinite",
        shimmer: "shimmer 1.6s ease-in-out infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "150% 0" },
          "100%": { backgroundPosition: "-50% 0" },
        },
      },
    },
  },
  plugins: [],
};
