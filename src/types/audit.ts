export type CheckStatus = "PASS" | "WARN" | "FAIL";
export type AuditSection = "technical" | "content" | "sem";
export type AuditProvider = "gemini";
export type AuditStatus = "pending" | "running" | "done" | "failed";

export interface AuditCheckInput {
  name: string;
  status: CheckStatus;
  finding: string;
  recommendation: string;
}

export interface AdGroup {
  name: string;
  keywords: string;
  rationale: string;
}

export interface QuickWin {
  rank: number;
  action: string;
  impact: string;
  effort: string;
}

export interface SectionAnalysis {
  score: number;
  grade: string;
  checks: AuditCheckInput[];
  priority_actions: string[];
}

export interface SemAnalysis extends SectionAnalysis {
  strengths: string[];
  issues: string[];
  ad_groups: AdGroup[];
  campaign_recommendations: string[];
}

export interface AnalysisResult {
  business_name: string;
  business_description: string;
  executive_summary: string;
  key_strengths: string;
  key_opportunities: string;
  technical_seo: SectionAnalysis;
  content_seo: SectionAnalysis;
  sem_readiness: SemAnalysis;
  overall_score: number;
  overall_grade: string;
  quick_wins: QuickWin[];
}

export interface PsiDetailHeading {
  key: string;
  label: string;
  valueType?: string;   // "url" | "bytes" | "ms" | "text" | "numeric" | "thumbnail" etc.
}

export interface PsiDetailItem {
  [key: string]: unknown;
}

export interface PsiAuditItem {
  id: string;
  title: string;
  description?: string;
  score: number | null;
  group: "opportunity" | "diagnostic" | "passed";
  displayValue?: string;
  savings_ms?: number;
  savings_bytes?: number;
  guidance?: string;
  details?: {
    headings: PsiDetailHeading[];
    items: PsiDetailItem[];
  };
}

export interface PsiResult {
  performance_score: number;       // 0–100
  fcp: number;                     // First Contentful Paint (ms)
  lcp: number;                     // Largest Contentful Paint (ms)
  cls: number;                     // Cumulative Layout Shift
  tbt: number;                     // Total Blocking Time (ms)
  si: number;                      // Speed Index (ms)
  ttfb: number;                    // Time to First Byte (ms)
  fcp_rating: string;              // FAST / AVERAGE / SLOW
  lcp_rating: string;
  cls_rating: string;
  tbt_rating: string;
  si_rating: string;
  strategy: string;                // mobile or desktop
  audits: PsiAuditItem[];
}

export interface CrawlData {
  // Page basics
  status_code?: number;
  final_url?: string;
  response_time_ms?: number;
  content_length?: number;
  headers?: Record<string, string>;
  fetch_error?: string;

  // Robots / Sitemap
  robots_txt_status?: number | string;
  robots_txt_content?: string;
  robots_txt_has_sitemap?: boolean;
  sitemap_status?: number | string;
  sitemap_url_count?: number;
  sitemap_contains_target?: boolean;

  // Meta
  title?: string | null;
  title_length?: number;
  meta_description?: string | null;
  meta_description_length?: number;
  meta_robots?: string | null;
  has_viewport?: boolean;
  charset?: string | null;
  html_lang?: string | null;

  // Content
  headings?: Record<string, string[]>;
  word_count?: number;
  content_text?: string;
  duplicate_paragraphs?: string[];
  paragraph_count?: number;

  // Links
  internal_links?: Array<{ href: string; text: string; original_href: string }>;
  internal_link_count?: number;
  external_links?: Array<{ href: string; text: string; original_href: string }>;
  external_link_count?: number;
  tel_links?: string[];
  has_phone_link?: boolean;

  // Images
  images?: Array<{
    src: string;
    is_placeholder: boolean;
    alt: string;
    has_alt: boolean;
    has_dimensions: boolean;
    has_lazy_loading: boolean;
    format: string;
  }>;
  image_count?: number;

  // Schema
  schema_types?: string[];
  has_schema?: boolean;

  // Forms
  forms?: Array<{
    action: string;
    method: string;
    field_count: number;
    fields: Array<{ name: string; type: string }>;
  }>;
  form_count?: number;

  // Social
  og_tags?: Record<string, string>;
  twitter_tags?: Record<string, string>;
  has_og_tags?: boolean;
  has_twitter_tags?: boolean;

  // HTTPS
  is_https?: boolean;
  mixed_content?: string[];
  has_mixed_content?: boolean;

  // Canonical
  canonical_url?: string | null;
  has_canonical?: boolean;

  // Tech
  external_script_count?: number;
  external_style_count?: number;
  tech_detected?: string[];

  // Security headers (detailed breakdown)
  security_headers?: {
    hsts?: string | null;
    csp?: string | null;
    x_frame_options?: string | null;
    x_content_type_options?: string | null;
    referrer_policy?: string | null;
    permissions_policy?: string | null;
    missing: string[];
  };

  // Script & stylesheet URLs
  external_scripts?: string[];
  external_styles?: string[];

  // CTA elements
  cta_elements?: Array<{
    tag: string;
    text: string;
    href?: string;
    position_index: number;
  }>;

  // Phone numbers found in body text
  phone_numbers_in_text?: string[];

  // Trust & social proof signals
  trust_signals?: {
    has_testimonials: boolean;
    has_reviews: boolean;
    has_trust_badges: boolean;
    has_certifications: boolean;
    has_partner_logos: boolean;
    details: string[];
  };

  // FAQ elements
  faq_elements?: Array<{ question: string; answer_preview: string }>;

  // Viewport meta content
  viewport_content?: string;

  // Favicon
  has_favicon?: boolean;

  // hreflang tags
  hreflang_tags?: Array<{ lang: string; href: string }>;

  // PageSpeed Insights (Core Web Vitals)
  psi?: PsiResult;                   // mobile strategy
  psi_desktop?: PsiResult;           // desktop strategy
  psi_error?: string;

  // Conversion/analytics tracking
  conversion_tracking?: {
    has_ga4: boolean;
    has_gtm: boolean;
    has_facebook_pixel: boolean;
    has_google_ads: boolean;
    has_linkedin_insight: boolean;
    has_hotjar: boolean;
    detected: string[];
  };
}

// SSE event shapes for the streaming audit runner
export type AuditStreamEvent =
  | { step: "crawl"; message: string }
  | { step: "crawl_done"; message: string }
  | { step: "analyze"; message: string }
  | { step: "analyze_done"; message: string }
  | { step: "scoring"; message: string }
  | { step: "saving"; message: string }
  | { step: "done"; auditId: string }
  | { step: "error"; message: string };
