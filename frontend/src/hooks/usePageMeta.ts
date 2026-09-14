import { useEffect } from "react";

const SITE_NAME = "JobNeed";

export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} · ${SITE_NAME}`;

    let previousDescription: string | null = null;
    let descriptionTag: HTMLMetaElement | null = null;
    if (description) {
      descriptionTag = document.querySelector('meta[name="description"]');
      if (descriptionTag) {
        previousDescription = descriptionTag.getAttribute("content");
        descriptionTag.setAttribute("content", description);
      }
    }

    return () => {
      document.title = previousTitle;
      if (descriptionTag && previousDescription !== null) {
        descriptionTag.setAttribute("content", previousDescription);
      }
    };
  }, [title, description]);
}
