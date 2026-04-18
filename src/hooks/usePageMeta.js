import { useEffect } from "react";

const SITE_NAME = "Sveriges Transportplattform";
const BASE_URL = "https://transportplattformen.se";

/**
 * Sets <title>, <meta name="description">, <link rel="canonical">,
 * and Open Graph tags for the current page.
 *
 * Google can render JS-SPAs — dynamically set meta tags are indexed.
 * Call once per page component.
 */
export function usePageMeta({ title, description, canonical, type = "website" }) {
  useEffect(() => {
    // Title
    document.title = title
      ? `${title} – ${SITE_NAME}`
      : `${SITE_NAME} – Jobb & rekrytering av yrkesförare`;

    // Helper: upsert a <meta> tag
    function setMeta(selector, attr, value) {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement("meta");
        const [attrName] = selector.match(/\[([^\]=]+)/) || [];
        if (attrName) {
          const name = attrName.replace("[", "").split("=")[0];
          const val = selector.match(/["']([^"']+)["']/)?.[1];
          if (name && val) el.setAttribute(name, val);
        }
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    }

    // Helper: upsert a <link> tag
    function setLink(rel, href) {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        document.head.appendChild(el);
      }
      el.setAttribute("href", href);
    }

    if (description) {
      setMeta('meta[name="description"]', "content", description);
      setMeta('meta[property="og:description"]', "content", description);
      setMeta('meta[name="twitter:description"]', "content", description);
    }

    if (canonical) {
      setLink("canonical", `${BASE_URL}${canonical}`);
      setMeta('meta[property="og:url"]', "content", `${BASE_URL}${canonical}`);
    }

    const fullTitle = title ? `${title} – ${SITE_NAME}` : `${SITE_NAME} – Jobb & rekrytering av yrkesförare`;
    setMeta('meta[property="og:title"]', "content", fullTitle);
    setMeta('meta[name="twitter:title"]', "content", fullTitle);
    setMeta('meta[property="og:type"]', "content", type);
  }, [title, description, canonical, type]);
}
