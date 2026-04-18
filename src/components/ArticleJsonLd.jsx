import { useEffect } from "react";

const SITE_NAME = "Sveriges Transportplattform";
const BASE_URL = "https://transportplattformen.se";
const PUBLISHER_LOGO = `${BASE_URL}/favicon.svg`;

/**
 * Injects a JSON-LD <script> with Article structured data.
 * Google uses this for rich results (article carousels, date display, etc.)
 *
 * Props:
 *   headline    — article title (required)
 *   description — short summary (required)
 *   datePublished — ISO date string, e.g. "2025-03-01"
 *   dateModified  — ISO date string (defaults to datePublished)
 *   url         — canonical path, e.g. "/blogg/ce-korkort-sverige"
 */
export default function ArticleJsonLd({ headline, description, datePublished, dateModified, url }) {
  useEffect(() => {
    const id = "article-jsonld";
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("script");
      el.id = id;
      el.type = "application/ld+json";
      document.head.appendChild(el);
    }

    el.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline,
      description,
      datePublished,
      dateModified: dateModified || datePublished,
      url: `${BASE_URL}${url}`,
      inLanguage: "sv-SE",
      author: {
        "@type": "Organization",
        name: SITE_NAME,
        url: BASE_URL,
      },
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        url: BASE_URL,
        logo: { "@type": "ImageObject", url: PUBLISHER_LOGO },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${BASE_URL}${url}`,
      },
    });

    return () => {
      // Remove on unmount so stale data doesn't linger when navigating
      el?.remove();
    };
  }, [headline, description, datePublished, dateModified, url]);

  return null;
}
