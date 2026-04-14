import { Helmet } from "react-helmet-async";

const SITE_NAME = "Sveriges Transportplattform";
const BASE_URL = "https://transportplattformen.se";
const DEFAULT_IMAGE = `${BASE_URL}/hero.png`;

/**
 * Manages <head> meta tags for a page: title, description, canonical,
 * Open Graph, Twitter Card and optional JSON-LD structured data.
 *
 * Usage:
 *   <PageMeta
 *     title="CE-chaufför – Nordic Transport"
 *     description="CE-chaufför sökes i Göteborg med YKB..."
 *     canonical="/jobb/123"
 *     jsonLd={{ "@context": "https://schema.org", "@type": "JobPosting", ... }}
 *   />
 */
export default function PageMeta({ title, description, canonical, image, type = "website", jsonLd }) {
  const fullTitle = title
    ? `${title} – ${SITE_NAME}`
    : `${SITE_NAME} – Jobb & rekrytering av yrkesförare`;
  const fullCanonical = canonical ? `${BASE_URL}${canonical}` : null;
  const img = image || DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {fullCanonical && <link rel="canonical" href={fullCanonical} />}

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {fullCanonical && <meta property="og:url" content={fullCanonical} />}
      <meta property="og:image" content={img} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={img} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
