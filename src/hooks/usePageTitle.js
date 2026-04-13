import { useEffect } from "react";

const SITE = "Sveriges Transportplattform";

/**
 * Sets document.title for the current page.
 * Pass a string to get "Title – Sveriges Transportplattform".
 * Pass nothing (or undefined) to fall back to the full brand title.
 */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} – ${SITE}` : `${SITE} – Jobb & rekrytering av yrkesförare`;
  }, [title]);
}
