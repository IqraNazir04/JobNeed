import { useRef } from "react";

export type ScrollerPhoto = { src: string; alt: string };

const arrowIconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function PhotoScroller({ photos }: { photos: ScrollerPhoto[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollByAmount(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.85, behavior: "smooth" });
  }

  return (
    <div className="group relative">
      <div
        ref={trackRef}
        className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2"
      >
        {photos.map((photo, i) => (
          <img
            key={photo.src}
            src={photo.src}
            alt={photo.alt}
            loading={i > 1 ? "lazy" : undefined}
            className="h-72 w-[82vw] shrink-0 snap-center rounded-2xl object-cover shadow-lg shadow-gray-900/10 sm:h-96 sm:w-[420px]"
          />
        ))}
      </div>

      <button
        onClick={() => scrollByAmount(-1)}
        aria-label="Scroll left"
        className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/90 text-gray-700 shadow-md backdrop-blur-sm transition-colors hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-300 sm:flex"
      >
        <svg {...arrowIconProps}>
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        onClick={() => scrollByAmount(1)}
        aria-label="Scroll right"
        className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/90 text-gray-700 shadow-md backdrop-blur-sm transition-colors hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-300 sm:flex"
      >
        <svg {...arrowIconProps}>
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
