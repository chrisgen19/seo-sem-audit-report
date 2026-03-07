/** Helpful documentation and tool links for each audit check. */

interface Resource {
  label: string;
  url: string;
}

export const CHECK_RESOURCES: Record<string, Resource[]> = {
  // ── Technical SEO ─────────────────────────────────────────────
  "HTTPS / SSL": [
    { label: "Google — Why HTTPS matters", url: "https://developers.google.com/search/docs/crawling-indexing/https" },
    { label: "SSL Labs — Test your SSL", url: "https://www.ssllabs.com/ssltest/" },
  ],
  "Indexability": [
    { label: "Google — Meta robots tag", url: "https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag" },
    { label: "Google — URL Inspection Tool", url: "https://support.google.com/webmasters/answer/9012289" },
  ],
  "Page Speed": [
    { label: "PageSpeed Insights", url: "https://pagespeed.web.dev/" },
    { label: "web.dev — Performance", url: "https://web.dev/performance/" },
    { label: "GTmetrix", url: "https://gtmetrix.com/" },
  ],
  "Mobile-Friendly": [
    { label: "Google — Mobile-first indexing", url: "https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing" },
    { label: "web.dev — Responsive design", url: "https://web.dev/articles/responsive-web-design-basics" },
  ],
  "Canonical Tag": [
    { label: "Google — Consolidate duplicate URLs", url: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls" },
    { label: "Moz — Canonical tag guide", url: "https://moz.com/learn/seo/canonicalization" },
  ],
  "Structured Data": [
    { label: "Google — Rich Results Test", url: "https://search.google.com/test/rich-results" },
    { label: "Schema Markup Validator", url: "https://validator.schema.org/" },
    { label: "Schema.org — Full reference", url: "https://schema.org/docs/full.html" },
    { label: "Google — Structured data guide", url: "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data" },
  ],
  "Mixed Content": [
    { label: "MDN — Mixed content", url: "https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content" },
    { label: "Why No Padlock? — Diagnose HTTPS", url: "https://www.whynopadlock.com/" },
  ],
  "Image Optimization": [
    { label: "web.dev — Optimize images", url: "https://web.dev/articles/choose-the-right-image-format" },
    { label: "Squoosh — Image compressor", url: "https://squoosh.app/" },
    { label: "web.dev — Serve responsive images", url: "https://web.dev/articles/serve-responsive-images" },
  ],
  "HTTP Security Headers": [
    { label: "SecurityHeaders.com — Scan your site", url: "https://securityheaders.com/" },
    { label: "MDN — HTTP headers", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers" },
    { label: "OWASP — Secure headers", url: "https://owasp.org/www-project-secure-headers/" },
  ],
  "Internal Linking": [
    { label: "Moz — Internal linking", url: "https://moz.com/learn/seo/internal-link" },
    { label: "Ahrefs — Internal linking guide", url: "https://ahrefs.com/blog/internal-links-for-seo/" },
  ],
  "Duplicate Content": [
    { label: "Google — Avoid duplicate content", url: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls" },
    { label: "Siteliner — Check for duplicates", url: "https://www.siteliner.com/" },
  ],
  "Lazy Loading": [
    { label: "web.dev — Lazy-loading images", url: "https://web.dev/articles/browser-level-image-lazy-loading" },
    { label: "MDN — loading attribute", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#loading" },
  ],
  "Redirect Handling": [
    { label: "Google — Redirects and search", url: "https://developers.google.com/search/docs/crawling-indexing/301-redirects" },
    { label: "Redirect Checker", url: "https://httpstatus.io/" },
  ],
  "Robots.txt": [
    { label: "Google — Robots.txt intro", url: "https://developers.google.com/search/docs/crawling-indexing/robots/intro" },
    { label: "Google — Robots.txt testing tool", url: "https://support.google.com/webmasters/answer/6062598" },
  ],
  "XML Sitemap": [
    { label: "Google — Build and submit a sitemap", url: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap" },
    { label: "XML-Sitemaps.com — Generator", url: "https://www.xml-sitemaps.com/" },
  ],
  "URL Structure": [
    { label: "Google — URL structure", url: "https://developers.google.com/search/docs/crawling-indexing/url-structure" },
    { label: "Moz — URL best practices", url: "https://moz.com/learn/seo/url" },
  ],

  // ── Content SEO ───────────────────────────────────────────────
  "Title Tag": [
    { label: "Google — Title links", url: "https://developers.google.com/search/docs/appearance/title-link" },
    { label: "Moz — Title tag guide", url: "https://moz.com/learn/seo/title-tag" },
    { label: "SERP Simulator", url: "https://mangools.com/free-seo-tools/serp-simulator" },
  ],
  "H1 Tag": [
    { label: "Moz — H1 tag for SEO", url: "https://moz.com/learn/seo/headings" },
  ],
  "Meta Description": [
    { label: "Google — Meta descriptions", url: "https://developers.google.com/search/docs/appearance/snippet" },
    { label: "Moz — Meta description guide", url: "https://moz.com/learn/seo/meta-description" },
    { label: "SERP Simulator", url: "https://mangools.com/free-seo-tools/serp-simulator" },
  ],
  "Keyword Targeting": [
    { label: "Moz — On-page SEO", url: "https://moz.com/learn/seo/on-site-seo" },
    { label: "Google Keyword Planner", url: "https://ads.google.com/home/tools/keyword-planner/" },
  ],
  "Content Depth": [
    { label: "Moz — Content quality", url: "https://moz.com/blog/content-quality" },
    { label: "web.dev — Content best practices", url: "https://web.dev/articles/content-best-practices" },
  ],
  "Image Alt Text": [
    { label: "Google — Image SEO", url: "https://developers.google.com/search/docs/appearance/google-images" },
    { label: "W3C — Alt text requirements", url: "https://www.w3.org/WAI/tutorials/images/" },
    { label: "MDN — img alt attribute", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#alt" },
  ],
  "Heading Hierarchy": [
    { label: "W3C — Headings and sections", url: "https://www.w3.org/WAI/tutorials/page-structure/headings/" },
    { label: "MDN — Heading elements", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements" },
  ],
  "Keyword in URL": [
    { label: "Moz — URL best practices", url: "https://moz.com/learn/seo/url" },
  ],
  "OG / Social Tags": [
    { label: "Open Graph Protocol", url: "https://ogp.me/" },
    { label: "Twitter Cards docs", url: "https://developer.x.com/en/docs/x-for-websites/cards/overview/abouts-cards" },
    { label: "Facebook Sharing Debugger", url: "https://developers.facebook.com/tools/debug/" },
    { label: "LinkedIn Post Inspector", url: "https://www.linkedin.com/post-inspector/" },
  ],
  "Local SEO / NAP": [
    { label: "Google Business Profile", url: "https://www.google.com/business/" },
    { label: "Moz — Local SEO guide", url: "https://moz.com/learn/seo/local" },
    { label: "Schema.org — LocalBusiness", url: "https://schema.org/LocalBusiness" },
  ],
  "External Links": [
    { label: "Moz — External linking", url: "https://moz.com/learn/seo/external-link" },
    { label: "Google — Qualify outbound links", url: "https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links" },
  ],
  "FAQ / Rich Content": [
    { label: "Google — FAQ structured data", url: "https://developers.google.com/search/docs/appearance/structured-data/faqpage" },
    { label: "Schema.org — FAQPage", url: "https://schema.org/FAQPage" },
  ],
  "CTA Placement": [
    { label: "Google Ads — Landing page experience", url: "https://support.google.com/google-ads/answer/6227382" },
  ],
  "HTML Lang Attribute": [
    { label: "Google — Localized versions", url: "https://developers.google.com/search/docs/specialty/international/localized-versions" },
    { label: "MDN — lang attribute", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang" },
  ],

  // ── SEM Readiness ─────────────────────────────────────────────
  "Landing Page Relevance": [
    { label: "Google Ads — About landing page experience", url: "https://support.google.com/google-ads/answer/6227382" },
    { label: "Google Ads — Improve Quality Score", url: "https://support.google.com/google-ads/answer/6167118" },
  ],
  "Clear Value Proposition": [
    { label: "Google Ads — Write effective ads", url: "https://support.google.com/google-ads/answer/6167101" },
  ],
  "Call to Action": [
    { label: "Google Ads — Landing page experience", url: "https://support.google.com/google-ads/answer/6227382" },
  ],
  "Above the Fold CTA": [
    { label: "web.dev — Optimize Largest Contentful Paint", url: "https://web.dev/articles/optimize-lcp" },
    { label: "Google Ads — Landing page experience", url: "https://support.google.com/google-ads/answer/6227382" },
  ],
  "Phone / Contact Visibility": [
    { label: "Google Ads — Call extensions", url: "https://support.google.com/google-ads/answer/2453991" },
    { label: "Schema.org — ContactPoint", url: "https://schema.org/ContactPoint" },
  ],
  "Lead Capture / Form": [
    { label: "Google Ads — Lead form extensions", url: "https://support.google.com/google-ads/answer/9423234" },
    { label: "web.dev — Form best practices", url: "https://web.dev/articles/sign-in-form-best-practices" },
  ],
  "Trust Signals": [
    { label: "Google — E-E-A-T and Quality Rater Guidelines", url: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content" },
  ],
  "Social Proof / Reviews": [
    { label: "Google — Review snippet", url: "https://developers.google.com/search/docs/appearance/structured-data/review-snippet" },
    { label: "Schema.org — AggregateRating", url: "https://schema.org/AggregateRating" },
  ],
  "Ad Keyword Alignment": [
    { label: "Google Ads — Choose keywords", url: "https://support.google.com/google-ads/answer/6323" },
    { label: "Google Keyword Planner", url: "https://ads.google.com/home/tools/keyword-planner/" },
  ],
  "Page Load Speed": [
    { label: "PageSpeed Insights", url: "https://pagespeed.web.dev/" },
    { label: "Google Ads — Landing page speed", url: "https://support.google.com/google-ads/answer/6227382" },
  ],
  "Mobile UX": [
    { label: "web.dev — Responsive design", url: "https://web.dev/articles/responsive-web-design-basics" },
    { label: "Google Ads — Mobile landing pages", url: "https://support.google.com/google-ads/answer/6227382" },
  ],
};
