import * as cheerio from "cheerio";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

export interface SitemapEntry {
  url: string;
  name: string;
}

/**
 * Generates a human-readable page name from a URL path.
 * e.g. "https://example.com/about-us/team" → "About Us / Team"
 *      "https://example.com/" → "Home"
 */
function pageNameFromUrl(url: string): string {
  try {
    const { pathname } = new URL(url);
    const clean = pathname.replace(/\/$/, "");
    if (!clean || clean === "") return "Home";

    return clean
      .split("/")
      .filter(Boolean)
      .map((seg) =>
        seg
          .replace(/[-_]/g, " ")
          .replace(/\.[^.]+$/, "") // strip file extensions
          .replace(/\b\w/g, (c) => c.toUpperCase())
      )
      .join(" / ");
  } catch {
    return url;
  }
}

/**
 * Fetches and parses a sitemap (or sitemap index) from a domain.
 * Handles:
 *  - Standard <urlset> sitemaps with <loc> entries
 *  - Sitemap index files (<sitemapindex>) with nested sitemaps
 *  - Multiple common sitemap paths as fallbacks
 *
 * Returns deduplicated SitemapEntry[] sorted alphabetically by URL.
 */
export async function scanSitemap(domain: string): Promise<SitemapEntry[]> {
  const base = domain.replace(/\/$/, "");
  const urls = new Set<string>();

  // Try common sitemap locations
  const candidates = [
    `${base}/sitemap.xml`,
    `${base}/sitemap_index.xml`,
    `${base}/sitemap-index.xml`,
  ];

  // Also check robots.txt for sitemap references
  try {
    const robotsResp = await fetchWithTimeout(`${base}/robots.txt`);
    if (robotsResp.ok) {
      const text = await robotsResp.text();
      const matches = text.match(/^Sitemap:\s*(.+)$/gim);
      if (matches) {
        for (const m of matches) {
          const sitemapUrl = m.replace(/^Sitemap:\s*/i, "").trim();
          if (sitemapUrl && !candidates.includes(sitemapUrl)) {
            candidates.unshift(sitemapUrl);
          }
        }
      }
    }
  } catch {
    // robots.txt not available, continue with defaults
  }

  for (const candidate of candidates) {
    try {
      const found = await fetchSitemapUrls(candidate);
      for (const u of found) urls.add(u);
      if (urls.size > 0) break; // got results, stop trying fallbacks
    } catch {
      continue;
    }
  }

  return [...urls]
    .sort()
    .map((url) => ({ url, name: pageNameFromUrl(url) }));
}

async function fetchSitemapUrls(
  sitemapUrl: string,
  depth = 0
): Promise<string[]> {
  if (depth > 2) return []; // prevent infinite recursion

  const resp = await fetchWithTimeout(sitemapUrl);
  if (!resp.ok) return [];

  const text = await resp.text();
  const $ = cheerio.load(text, { xmlMode: true });

  // Check if this is a sitemap index
  const sitemapLocs = $("sitemapindex sitemap loc");
  if (sitemapLocs.length > 0) {
    const nested: string[] = [];
    const childUrls = sitemapLocs
      .toArray()
      .map((el) => $(el).text().trim());

    for (const child of childUrls) {
      const childResults = await fetchSitemapUrls(child, depth + 1);
      nested.push(...childResults);
    }
    return nested;
  }

  // Standard urlset
  return $("urlset url loc")
    .toArray()
    .map((el) => $(el).text().trim())
    .filter(Boolean);
}

async function fetchWithTimeout(url: string, timeoutMs = 15_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { headers: HEADERS, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
