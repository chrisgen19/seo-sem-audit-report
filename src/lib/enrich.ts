import type { AnalysisResult, AuditCheckInput, CrawlData } from "@/types/audit";

/**
 * Enriches AI-generated findings with actual item lists from the crawl data.
 * The AI provides the summary + status; this function appends deterministic
 * evidence so the detail is accurate and doesn't waste AI tokens.
 */
export function enrichFindings(
  analysis: AnalysisResult,
  crawl: CrawlData
): AnalysisResult {
  const techMap = new Map(analysis.technical_seo.checks.map((c) => [c.name, c]));
  const contentMap = new Map(analysis.content_seo.checks.map((c) => [c.name, c]));
  const semMap = new Map(analysis.sem_readiness.checks.map((c) => [c.name, c]));

  // ── Technical SEO ──────────────────────────────────────────────

  appendTo(techMap, "HTTPS / SSL", () => {
    const lines: string[] = [];
    lines.push(`Protocol: ${crawl.is_https ? "HTTPS" : "HTTP"}`);
    if (crawl.final_url) lines.push(`URL: ${crawl.final_url}`);
    if (crawl.has_mixed_content) lines.push(`Mixed content: Yes (${crawl.mixed_content?.length ?? 0} resource(s))`);
    else lines.push("Mixed content: None detected");
    return formatList("HTTPS status", lines);
  });

  appendTo(techMap, "Indexability", () => {
    const lines: string[] = [];
    if (crawl.status_code !== undefined) lines.push(`HTTP status: ${crawl.status_code}`);
    if (crawl.meta_robots) lines.push(`meta robots: "${crawl.meta_robots}"`);
    else lines.push("meta robots: not set (defaults to index, follow)");
    return formatList("Indexability details", lines);
  });

  appendTo(techMap, "Canonical Tag", () => {
    if (crawl.canonical_url) return `\n\nCanonical URL: ${crawl.canonical_url}`;
    return "\n\nCanonical tag: NOT SET";
  });

  appendTo(techMap, "Internal Linking", () => {
    const links = crawl.internal_links ?? [];
    const total = crawl.internal_link_count ?? links.length;
    if (!total) return "\n\nNo internal links found on the page.";
    return formatList(
      `Internal links found (${total})`,
      links.slice(0, 15).map((l) => `${l.href}${l.text ? ` ("${truncate(l.text, 40)}")` : ""}`)
    );
  });

  appendTo(techMap, "URL Structure", () => {
    if (!crawl.final_url) return null;
    try {
      const url = new URL(crawl.final_url);
      const lines: string[] = [];
      lines.push(`Path: ${url.pathname}`);
      if (url.search) lines.push(`Query string: ${url.search}`);
      if (url.hash) lines.push(`Fragment: ${url.hash}`);
      const hasUppercase = /[A-Z]/.test(url.pathname);
      const hasUnderscore = /_/.test(url.pathname);
      if (hasUppercase) lines.push("⚠ Path contains uppercase characters");
      if (hasUnderscore) lines.push("⚠ Path contains underscores (prefer hyphens)");
      return formatList("URL analysis", lines);
    } catch {
      return null;
    }
  });

  appendTo(techMap, "Duplicate Content", () => {
    const dupes = crawl.duplicate_paragraphs ?? [];
    if (!dupes.length) return null;
    return formatList(`Duplicate paragraphs detected (${dupes.length})`, dupes);
  });

  appendTo(techMap, "Lazy Loading", () => {
    const imgs = (crawl.images ?? []).filter((i) => !i.has_lazy_loading);
    if (!imgs.length) return null;
    return formatList(
      `Images without lazy loading (${imgs.length} of ${crawl.image_count ?? crawl.images?.length ?? 0})`,
      imgs.map((i) => describeImage(i))
    );
  });

  appendTo(techMap, "Image Optimization", () => {
    const issues: string[] = [];
    const imgs = crawl.images ?? [];
    const noDims = imgs.filter((i) => !i.has_dimensions);
    const placeholders = imgs.filter((i) => i.is_placeholder);
    const unknown = imgs.filter((i) => i.format === "unknown" && !i.is_placeholder);
    if (noDims.length) issues.push(...noDims.map((i) => `${describeImage(i)} — missing width/height`));
    if (placeholders.length) issues.push(...placeholders.map((i) => `${describeImage(i)} — placeholder/base64`));
    if (unknown.length) issues.push(...unknown.map((i) => `${describeImage(i)} — unknown format`));
    if (!issues.length) return null;
    return formatList("Image issues detected", issues);
  });

  appendTo(techMap, "HTTP Security Headers", () => {
    const sh = crawl.security_headers;
    if (!sh) return null;
    const lines: string[] = [];
    if (sh.missing.length) {
      lines.push(...sh.missing.map((h) => `${h} — not set`));
    }
    if (sh.hsts) lines.push(`Strict-Transport-Security: ${sh.hsts}`);
    if (sh.csp) lines.push(`Content-Security-Policy: ${truncate(sh.csp, 120)}`);
    if (sh.x_frame_options) lines.push(`X-Frame-Options: ${sh.x_frame_options}`);
    if (sh.x_content_type_options) lines.push(`X-Content-Type-Options: ${sh.x_content_type_options}`);
    if (sh.referrer_policy) lines.push(`Referrer-Policy: ${sh.referrer_policy}`);
    if (!lines.length) return null;
    return formatList(
      sh.missing.length ? `Missing ${sh.missing.length} security header(s)` : "Security headers found",
      lines
    );
  });

  appendTo(techMap, "Mixed Content", () => {
    const mixed = crawl.mixed_content ?? [];
    if (!mixed.length) return null;
    return formatList(`Mixed content resources (${mixed.length})`, mixed);
  });

  appendTo(techMap, "Structured Data", () => {
    const types = crawl.schema_types ?? [];
    if (!types.length) return "\n\nNo JSON-LD schema types detected on the page.";
    const known = types.filter((t) => t !== "Unknown");
    const unknownCount = types.length - known.length;
    const lines = [
      ...known,
      ...(unknownCount > 0 ? [`Unknown (${unknownCount}) — unrecognized @type value, won't generate rich results`] : []),
    ];
    return formatList("Schema types detected", lines);
  });

  appendTo(techMap, "XML Sitemap", () => {
    const lines: string[] = [];
    if (crawl.sitemap_status !== undefined) lines.push(`Sitemap status: ${crawl.sitemap_status}`);
    if (crawl.sitemap_url_count !== undefined) lines.push(`URLs in sitemap: ${crawl.sitemap_url_count}`);
    if (crawl.sitemap_contains_target !== undefined)
      lines.push(`Target URL in sitemap: ${crawl.sitemap_contains_target ? "Yes" : "No"}`);
    if (!lines.length) return null;
    return formatList("Sitemap details", lines);
  });

  appendTo(techMap, "Robots.txt", () => {
    if (!crawl.robots_txt_content) return null;
    const preview = crawl.robots_txt_content.slice(0, 500);
    return `\n\nRobots.txt content:\n${preview}`;
  });

  // ── Content SEO ────────────────────────────────────────────────

  appendTo(contentMap, "Title Tag", () => {
    if (!crawl.title) return null;
    return `\n\nActual title (${crawl.title_length ?? 0} chars):\n- "${crawl.title}"`;
  });

  appendTo(contentMap, "Meta Description", () => {
    if (crawl.meta_description === undefined) return null;
    if (!crawl.meta_description) return "\n\nMeta description: NOT SET";
    return `\n\nActual meta description (${crawl.meta_description_length ?? 0} chars):\n- "${crawl.meta_description}"`;
  });

  appendTo(contentMap, "H1 Tag", () => {
    const h1s = crawl.headings?.h1 ?? [];
    if (!h1s.length) return "\n\nNo H1 tag found on the page.";
    return formatList(`H1 tag(s) found (${h1s.length})`, h1s.map((h) => `"${h}"`));
  });

  appendTo(contentMap, "Image Alt Text", () => {
    const imgs = (crawl.images ?? []).filter((i) => !i.has_alt);
    if (!imgs.length) return null;
    return formatList(
      `Images missing alt text (${imgs.length} of ${crawl.image_count ?? crawl.images?.length ?? 0})`,
      imgs.map((i) => extractFilename(i.src) + (i.format !== "unknown" ? ` (${i.format})` : ""))
    );
  });

  appendTo(contentMap, "Heading Hierarchy", () => {
    const headings = crawl.headings ?? {};
    const lines: string[] = [];
    for (const level of ["h1", "h2", "h3", "h4", "h5", "h6"]) {
      for (const text of headings[level] ?? []) {
        lines.push(`${level.toUpperCase()}: "${text}"`);
      }
    }
    if (!lines.length) return null;
    return formatList("Heading structure", lines);
  });

  appendTo(contentMap, "OG / Social Tags", () => {
    const og = crawl.og_tags ?? {};
    const tw = crawl.twitter_tags ?? {};
    const lines: string[] = [];
    for (const [key, val] of Object.entries(og)) lines.push(`${key}: "${truncate(val, 80)}"`);
    for (const [key, val] of Object.entries(tw)) lines.push(`${key}: "${truncate(val, 80)}"`);
    if (!lines.length) return "\n\nNo OG or Twitter meta tags found.";
    return formatList("Social/OG tags found", lines);
  });

  appendTo(contentMap, "HTML Lang Attribute", () => {
    return `\n\nhtml lang attribute: ${crawl.html_lang ? `"${crawl.html_lang}"` : "NOT SET"}`;
  });

  appendTo(contentMap, "Content Depth", () => {
    const lines: string[] = [];
    if (crawl.word_count !== undefined) lines.push(`Word count: ${crawl.word_count}`);
    if (crawl.paragraph_count !== undefined) lines.push(`Paragraphs: ${crawl.paragraph_count}`);
    const h1c = crawl.headings?.h1?.length ?? 0;
    const h2c = crawl.headings?.h2?.length ?? 0;
    const h3c = crawl.headings?.h3?.length ?? 0;
    lines.push(`Headings: ${h1c} H1, ${h2c} H2, ${h3c} H3`);
    return formatList("Content metrics", lines);
  });

  appendTo(contentMap, "External Links", () => {
    const links = crawl.external_links ?? [];
    if (!links.length) return "\n\nNo external links found.";
    return formatList(
      `External links (${crawl.external_link_count ?? links.length})`,
      links.slice(0, 15).map((l) => `${l.href} ${l.text ? `("${truncate(l.text, 40)}")` : ""}`)
    );
  });

  appendTo(contentMap, "FAQ / Rich Content", () => {
    const faqs = crawl.faq_elements ?? [];
    if (!faqs.length) return null;
    return formatList(
      `FAQ elements found (${faqs.length})`,
      faqs.map((f) => f.question)
    );
  });

  appendTo(contentMap, "CTA Placement", () => {
    const ctas = crawl.cta_elements ?? [];
    if (!ctas.length) return "\n\nNo CTA elements found on the page.";
    const aboveFold = ctas.filter((c) => c.position_index < 5);
    const lines: string[] = [];
    lines.push(`Total CTAs: ${ctas.length}`);
    lines.push(`Above the fold (early DOM): ${aboveFold.length}`);
    if (aboveFold.length) {
      lines.push(...aboveFold.map((c) => `<${c.tag}> "${c.text}"`));
    }
    return formatList("CTA placement analysis", lines);
  });

  // ── SEM Readiness ──────────────────────────────────────────────

  appendTo(semMap, "Call to Action", () => {
    const ctas = crawl.cta_elements ?? [];
    if (!ctas.length) return "\n\nNo CTA elements detected on the page.";
    return formatList(
      `CTA elements detected (${ctas.length})`,
      ctas.slice(0, 15).map((c) => `<${c.tag}> "${c.text}"${c.href ? ` → ${truncate(c.href, 60)}` : ""}`)
    );
  });

  appendTo(semMap, "Above the Fold CTA", () => {
    const ctas = (crawl.cta_elements ?? []).filter((c) => c.position_index < 5);
    if (!ctas.length) return null;
    return formatList(
      "Early CTA elements (likely above the fold)",
      ctas.map((c) => `<${c.tag}> "${c.text}"`)
    );
  });

  appendTo(semMap, "Phone / Contact Visibility", () => {
    const lines: string[] = [];
    const telLinks = crawl.tel_links ?? [];
    const textPhones = crawl.phone_numbers_in_text ?? [];
    if (telLinks.length) lines.push(...telLinks.map((t) => `tel: link — ${t}`));
    if (textPhones.length) lines.push(...textPhones.map((p) => `In page text — ${p}`));
    if (!lines.length) return "\n\nNo phone numbers or tel: links found.";
    return formatList("Phone/contact numbers found", lines);
  });

  appendTo(semMap, "Lead Capture / Form", () => {
    const forms = crawl.forms ?? [];
    if (!forms.length) return "\n\nNo forms detected on the page.";
    return formatList(
      `Forms detected (${forms.length})`,
      forms.map((f) => `action="${f.action || "(none)"}" method="${f.method || "GET"}" — ${f.field_count} field(s): ${f.fields.map((fd) => fd.name).join(", ")}`)
    );
  });

  appendTo(semMap, "Trust Signals", () => {
    const ts = crawl.trust_signals;
    if (!ts) return null;
    if (!ts.details.length) return "\n\nNo trust signals detected (no testimonials, reviews, badges, certifications, or partner logos found).";
    return formatList("Trust signals detected", ts.details);
  });

  appendTo(semMap, "Social Proof / Reviews", () => {
    const ts = crawl.trust_signals;
    if (!ts) return null;
    const lines: string[] = [];
    lines.push(`Testimonials: ${ts.has_testimonials ? "Yes" : "No"}`);
    lines.push(`Reviews/Ratings: ${ts.has_reviews ? "Yes" : "No"}`);
    lines.push(`Trust Badges: ${ts.has_trust_badges ? "Yes" : "No"}`);
    lines.push(`Certifications: ${ts.has_certifications ? "Yes" : "No"}`);
    lines.push(`Partner/Client Logos: ${ts.has_partner_logos ? "Yes" : "No"}`);
    return formatList("Social proof breakdown", lines);
  });

  appendTo(semMap, "Page Load Speed", () => {
    if (crawl.response_time_ms === undefined) return null;
    return `\n\nServer response time: ${crawl.response_time_ms}ms`;
  });

  appendTo(semMap, "Mobile UX", () => {
    const lines: string[] = [];
    lines.push(`Viewport meta: ${crawl.has_viewport ? "Yes" : "No"}`);
    if (crawl.viewport_content) lines.push(`Viewport content: "${crawl.viewport_content}"`);
    return formatList("Mobile readiness", lines);
  });

  // Rebuild with enriched checks
  return {
    ...analysis,
    technical_seo: {
      ...analysis.technical_seo,
      checks: Array.from(techMap.values()),
    },
    content_seo: {
      ...analysis.content_seo,
      checks: Array.from(contentMap.values()),
    },
    sem_readiness: {
      ...analysis.sem_readiness,
      checks: Array.from(semMap.values()),
    },
  };
}

// ── Helpers ────────────────────────────────────────────────────────

function appendTo(
  map: Map<string, AuditCheckInput>,
  checkName: string,
  buildDetail: () => string | null
) {
  const check = map.get(checkName);
  if (!check) return;
  const detail = buildDetail();
  if (detail) {
    check.finding = check.finding.trimEnd() + detail;
  }
}

function formatList(heading: string, items: string[]): string {
  if (!items.length) return "";
  const list = items.map((item) => `- ${item}`).join("\n");
  return `\n\n${heading}:\n${list}`;
}

function extractFilename(src: string): string {
  if (!src || src.startsWith("data:")) return "(inline base64)";
  try {
    const path = new URL(src, "https://placeholder.com").pathname;
    const filename = path.split("/").pop() ?? src;
    return filename.slice(0, 80) || src.slice(0, 80);
  } catch {
    return src.slice(0, 80);
  }
}

function describeImage(img: { src: string; alt: string; format: string; is_placeholder: boolean }): string {
  const name = extractFilename(img.src);
  const parts: string[] = [name];
  if (img.alt) parts.push(`alt="${truncate(img.alt, 50)}"`);
  if (img.format !== "unknown") parts.push(`(${img.format})`);
  return parts.join(" ");
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max).trimEnd() + "…";
}
