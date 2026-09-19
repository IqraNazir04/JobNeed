import type { ReactNode } from "react";

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export const HomeIcon = () => (
  <Svg>
    <path d="M3 11l9-8 9 8" />
    <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
  </Svg>
);

export const SearchIcon = () => (
  <Svg>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M20 20l-4.9-4.9" />
  </Svg>
);

export const AssistantIcon = () => (
  <Svg>
    <path d="M12 3l1.6 4.2L18 9l-4.4 1.8L12 15l-1.6-4.2L6 9l4.4-1.8z" />
    <path d="M19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z" />
  </Svg>
);

export const TrackerIcon = () => (
  <Svg>
    <rect x="3" y="4" width="4.5" height="16" rx="1" />
    <rect x="9.75" y="4" width="4.5" height="10" rx="1" />
    <rect x="16.5" y="4" width="4.5" height="13" rx="1" />
  </Svg>
);

export const CVIcon = () => (
  <Svg>
    <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
    <path d="M9 13h6M9 17h6M9 9h2" />
  </Svg>
);

export const InterviewIcon = () => (
  <Svg>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    <path d="M12 8v4M12 15.5h.01" />
  </Svg>
);

export const SpeakingIcon = () => (
  <Svg>
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
    <path d="M12 18v4M9 22h6" />
  </Svg>
);
