// Fixed scoring rubric — weights never change between runs.
// PASS=1.0, WARN=0.5, FAIL=0.0

export const TECHNICAL_CHECKS: [string, number][] = [
  ["HTTPS / SSL", 8],
  ["Indexability", 8],
  ["Page Speed", 7],
  ["Mobile-Friendly", 7],
  ["Canonical Tag", 6],
  ["Structured Data", 6],
  ["Mixed Content", 6],
  ["Image Optimization", 6],
  ["HTTP Security Headers", 5],
  ["Internal Linking", 5],
  ["Duplicate Content", 5],
  ["Lazy Loading", 4],
  ["Redirect Handling", 4],
  ["Robots.txt", 4],
  ["XML Sitemap", 4],
  ["URL Structure", 3],
];

export const CONTENT_CHECKS: [string, number][] = [
  ["Title Tag", 10],
  ["H1 Tag", 10],
  ["Meta Description", 8],
  ["Keyword Targeting", 8],
  ["Content Depth", 7],
  ["Image Alt Text", 7],
  ["Heading Hierarchy", 6],
  ["Keyword in URL", 5],
  ["OG / Social Tags", 5],
  ["Local SEO / NAP", 5],
  ["External Links", 4],
  ["FAQ / Rich Content", 4],
  ["CTA Placement", 4],
  ["HTML Lang Attribute", 3],
];

export const SEM_CHECKS: [string, number][] = [
  ["Landing Page Relevance", 12],
  ["Clear Value Proposition", 10],
  ["Call to Action", 10],
  ["Above the Fold CTA", 8],
  ["Phone / Contact Visibility", 8],
  ["Lead Capture / Form", 7],
  ["Trust Signals", 7],
  ["Social Proof / Reviews", 7],
  ["Ad Keyword Alignment", 7],
  ["Page Load Speed", 6],
  ["Mobile UX", 6],
];

export const STATUS_VALUES: Record<string, number> = {
  PASS: 1.0,
  WARN: 0.5,
  FAIL: 0.0,
};

export const GEMINI_MODEL =
  process.env.GEMINI_MODEL ?? "gemini-2.5-pro-preview-03-25";
