import * as cheerio from "cheerio";
import type { CrawlData } from "@/types/audit";

type ProgressCallback = (message: string) => void;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

async function fetchWithTimeout(
  url: string,
  timeoutMs = 30_000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { headers: HEADERS, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export class SEOCrawler {
  private url: string;
  private parsed: URL;
  private baseUrl: string;
  private data: CrawlData = {};
  private html = "";
  private $: cheerio.CheerioAPI = cheerio.load("");
  private onProgress: ProgressCallback;

  constructor(url: string, onProgress: ProgressCallback = () => {}) {
    this.url = url;
    this.parsed = new URL(url);
    this.baseUrl = `${this.parsed.protocol}//${this.parsed.host}`;
    this.onProgress = onProgress;
  }

  async crawl(): Promise<CrawlData> {
    await this.fetchPage();
    await this.checkRobotsTxt();
    await this.checkSitemap();
    this.extractMeta();
    this.extractHeadings();
    this.extractContent();
    this.extractLinks();
    this.extractImages();
    this.extractSchema();
    this.extractForms();
    this.extractSocialTags();
    this.checkHttps();
    this.checkCanonical();
    this.extractScriptsAndStyles();
    return this.data;
  }

  private async fetchPage() {
    this.onProgress("Fetching page...");
    try {
      const start = Date.now();
      const resp = await fetchWithTimeout(this.url);
      const elapsed = Date.now() - start;
      const text = await resp.text();

      this.data.status_code = resp.status;
      this.data.final_url = resp.url;
      this.data.response_time_ms = elapsed;
      this.data.content_length = new TextEncoder().encode(text).length;
      this.data.headers = Object.fromEntries(resp.headers.entries());
      this.html = text;
      this.$ = cheerio.load(text);

      this.onProgress(
        `Page fetched — ${resp.status} | ${elapsed}ms | ${(this.data.content_length / 1024).toFixed(0)}KB`
      );
    } catch (err) {
      this.data.fetch_error = String(err);
      this.onProgress(`Failed to fetch page: ${err}`);
    }
  }

  private async checkRobotsTxt() {
    this.onProgress("Checking robots.txt...");
    try {
      const resp = await fetchWithTimeout(`${this.baseUrl}/robots.txt`, 10_000);
      this.data.robots_txt_status = resp.status;
      if (resp.status === 200) {
        const text = await resp.text();
        this.data.robots_txt_content = text.slice(0, 2000);
        this.data.robots_txt_has_sitemap = text.toLowerCase().includes("sitemap");
        this.onProgress(`robots.txt found (${text.length} chars)`);
      } else {
        this.onProgress(`robots.txt status: ${resp.status}`);
      }
    } catch {
      this.data.robots_txt_status = "error";
      this.onProgress("robots.txt: error");
    }
  }

  private async checkSitemap() {
    this.onProgress("Checking sitemap.xml...");
    try {
      const resp = await fetchWithTimeout(`${this.baseUrl}/sitemap.xml`, 10_000);
      this.data.sitemap_status = resp.status;
      if (resp.status === 200) {
        const text = await resp.text();
        const $xml = cheerio.load(text, { xmlMode: true });
        const urls = $xml("loc")
          .toArray()
          .map((el) => $xml(el).text());
        this.data.sitemap_url_count = urls.length;
        this.data.sitemap_contains_target = urls.some((u) =>
          u.includes(this.url.replace(/\/$/, ""))
        );
        this.onProgress(
          `Sitemap: ${urls.length} URLs — target ${this.data.sitemap_contains_target ? "included" : "NOT included"}`
        );
      } else {
        this.onProgress(`sitemap.xml status: ${resp.status}`);
      }
    } catch {
      this.data.sitemap_status = "error";
      this.onProgress("sitemap.xml: error");
    }
  }

  private extractMeta() {
    this.onProgress("Extracting meta tags...");
    const $ = this.$;

    const title = $("title").first().text().trim() || null;
    this.data.title = title;
    this.data.title_length = title?.length ?? 0;

    const metaDesc = $('meta[name="description"]').attr("content")?.trim() ?? null;
    this.data.meta_description = metaDesc;
    this.data.meta_description_length = metaDesc?.length ?? 0;

    this.data.meta_robots = $('meta[name="robots"]').attr("content") ?? null;
    this.data.has_viewport = $('meta[name="viewport"]').length > 0;
    this.data.charset = $("meta[charset]").attr("charset") ?? null;
    this.data.html_lang = $("html").attr("lang") ?? null;

    this.onProgress(
      `Title: "${title}" (${this.data.title_length} chars) | Meta desc: ${metaDesc ? `${this.data.meta_description_length} chars` : "NOT SET"} | lang: ${this.data.html_lang ?? "NOT SET"}`
    );
  }

  private extractHeadings() {
    this.onProgress("Extracting headings...");
    const $ = this.$;
    const headings: Record<string, string[]> = {};
    for (let i = 1; i <= 6; i++) {
      headings[`h${i}`] = $(`h${i}`)
        .toArray()
        .map((el) => $(el).text().trim());
    }
    this.data.headings = headings;
    this.onProgress(
      `H1: ${headings.h1.length} | H2: ${headings.h2.length} | H3: ${headings.h3.length}`
    );
  }

  private extractContent() {
    this.onProgress("Analyzing content...");
    // Work on a clone so we don't mutate main $
    const $ = cheerio.load(this.html);
    $("script, style, nav, header, footer, noscript").remove();
    const text = $("body").text().replace(/\s+/g, " ").trim();
    const words = text.split(" ").filter(Boolean);
    this.data.word_count = words.length;
    this.data.content_text = text.slice(0, 5000);

    const paragraphs = $("p")
      .toArray()
      .map((el) => $(el).text().trim())
      .filter((p) => p.length > 50);
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const p of paragraphs) {
      if (seen.has(p)) duplicates.push(p.slice(0, 100) + "...");
      seen.add(p);
    }
    this.data.duplicate_paragraphs = duplicates;
    this.data.paragraph_count = paragraphs.length;

    this.onProgress(
      `Words: ${words.length} | Paragraphs: ${paragraphs.length}${duplicates.length ? ` | Duplicates: ${duplicates.length}` : ""}`
    );
  }

  private extractLinks() {
    this.onProgress("Extracting links...");
    const $ = this.$;
    const internal: CrawlData["internal_links"] = [];
    const external: CrawlData["external_links"] = [];
    const telLinks: string[] = [];

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      const text = $(el).text().trim();

      if (href.startsWith("tel:")) {
        telLinks.push(href.replace("tel:", "").trim());
        return;
      }
      if (href.startsWith("#") || href.startsWith("mailto:")) return;

      let fullUrl: string;
      try {
        fullUrl = new URL(href, this.url).toString();
      } catch {
        return;
      }
      const parsedLink = new URL(fullUrl);
      const entry = { href: fullUrl, text: text.slice(0, 80), original_href: href };
      if (parsedLink.host === this.parsed.host) {
        internal.push(entry);
      } else {
        external.push(entry);
      }
    });

    this.data.internal_links = internal.slice(0, 50);
    this.data.internal_link_count = internal.length;
    this.data.external_links = external.slice(0, 20);
    this.data.external_link_count = external.length;
    this.data.tel_links = telLinks;
    this.data.has_phone_link = telLinks.length > 0;

    this.onProgress(
      `Internal: ${internal.length} | External: ${external.length} | Phone: ${telLinks.length}`
    );
  }

  private extractImages() {
    this.onProgress("Extracting images...");
    const $ = this.$;
    const images: NonNullable<CrawlData["images"]> = [];

    $("img").each((_, el) => {
      const rawSrc = $(el).attr("src") ?? "";
      const realSrc =
        $(el).attr("data-nitro-lazy-src") ??
        $(el).attr("data-src") ??
        $(el).attr("data-lazy-src") ??
        $(el).attr("data-original") ??
        $(el).attr("data-lazy") ??
        (rawSrc.includes("base64") || rawSrc.includes("nitro-empty") ? "" : rawSrc);

      const src = (realSrc || rawSrc).slice(0, 200);
      const isPlaceholder = rawSrc.includes("base64") || rawSrc.includes("nitro-empty");
      const alt = $(el).attr("alt") ?? "";
      const width = $(el).attr("width") ?? $(el).attr("data-width");
      const height = $(el).attr("height") ?? $(el).attr("data-height");
      const loading = $(el).attr("loading");
      const isLazy =
        loading === "lazy" ||
        !!($(el).attr("data-src") || $(el).attr("data-nitro-lazy-src"));

      const ext = src.split(".").pop()?.split("?")[0]?.toLowerCase() ?? "unknown";
      const validExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif", "ico"];

      images.push({
        src,
        is_placeholder: isPlaceholder,
        alt: alt.slice(0, 150),
        has_alt: alt.trim().length > 0,
        has_dimensions: !!(width && height),
        has_lazy_loading: isLazy,
        format: validExts.includes(ext) ? ext : "unknown",
      });
    });

    this.data.images = images.slice(0, 30);
    this.data.image_count = images.length;

    const missingAlt = images.filter((i) => !i.has_alt).length;
    const lazyCount = images.filter((i) => i.has_lazy_loading).length;
    this.onProgress(
      `Images: ${images.length} | Missing alt: ${missingAlt} | Lazy-loaded: ${lazyCount}`
    );
  }

  private extractSchema() {
    this.onProgress("Checking structured data...");
    const $ = this.$;
    const schemas: string[] = [];

    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() ?? "{}");
        if (Array.isArray(json)) {
          json.forEach((item) => schemas.push(item["@type"] ?? "Unknown"));
        } else {
          schemas.push(json["@type"] ?? "Unknown");
        }
      } catch {
        /* ignore invalid JSON-LD */
      }
    });

    this.data.schema_types = schemas;
    this.data.has_schema = schemas.length > 0;
    this.onProgress(schemas.length ? `Schema: ${schemas.join(", ")}` : "No JSON-LD detected");
  }

  private extractForms() {
    this.onProgress("Checking forms...");
    const $ = this.$;
    const forms: NonNullable<CrawlData["forms"]> = [];

    $("form").each((_, el) => {
      const fields: Array<{ name: string; type: string }> = [];
      $(el)
        .find("input, select, textarea")
        .each((__, field) => {
          fields.push({
            name: $(field).attr("name") ?? $(field).attr("id") ?? "unnamed",
            type: $(field).attr("type") ?? field.tagName,
          });
        });
      forms.push({
        action: $(el).attr("action") ?? "",
        method: $(el).attr("method") ?? "",
        field_count: fields.length,
        fields: fields.slice(0, 20),
      });
    });

    this.data.forms = forms;
    this.data.form_count = forms.length;
    this.onProgress(`Forms: ${forms.length}`);
  }

  private extractSocialTags() {
    this.onProgress("Checking OG/social tags...");
    const $ = this.$;
    const og: Record<string, string> = {};
    const twitter: Record<string, string> = {};

    $("meta[property]").each((_, el) => {
      const prop = $(el).attr("property") ?? "";
      if (prop.startsWith("og:")) og[prop] = ($(el).attr("content") ?? "").slice(0, 200);
    });

    $("meta[name]").each((_, el) => {
      const name = $(el).attr("name") ?? "";
      if (name.startsWith("twitter:"))
        twitter[name] = ($(el).attr("content") ?? "").slice(0, 200);
    });

    this.data.og_tags = og;
    this.data.twitter_tags = twitter;
    this.data.has_og_tags = Object.keys(og).length > 0;
    this.data.has_twitter_tags = Object.keys(twitter).length > 0;
    this.onProgress(`OG: ${Object.keys(og).length} tags | Twitter: ${Object.keys(twitter).length} tags`);
  }

  private checkHttps() {
    this.onProgress("Checking HTTPS / mixed content...");
    const $ = this.$;
    this.data.is_https = this.parsed.protocol === "https:";
    const mixed: string[] = [];

    $("img[src], script[src]").each((_, el) => {
      const src = $(el).attr("src") ?? "";
      if (src.startsWith("http://")) mixed.push(src.slice(0, 100));
    });
    $('link[rel="stylesheet"]').each((_, el) => {
      const href = $(el).attr("href") ?? "";
      if (href.startsWith("http://")) mixed.push(href.slice(0, 100));
    });

    this.data.mixed_content = mixed.slice(0, 10);
    this.data.has_mixed_content = mixed.length > 0;
    this.onProgress(`HTTPS: ${this.data.is_https ? "Yes" : "No"} | Mixed content: ${mixed.length}`);
  }

  private checkCanonical() {
    this.onProgress("Checking canonical tag...");
    const $ = this.$;
    const canonical = $('link[rel="canonical"]').attr("href") ?? null;
    this.data.canonical_url = canonical;
    this.data.has_canonical = canonical !== null;
    this.onProgress(`Canonical: ${canonical ?? "Not set"}`);
  }

  private extractScriptsAndStyles() {
    const $ = this.$;
    this.data.external_script_count = $("script[src]").length;
    this.data.external_style_count = $('link[rel="stylesheet"]').length;

    const indicators: string[] = [];
    if (this.html.includes("wp-content")) indicators.push("WordPress");
    if (this.html.toLowerCase().includes("shopify")) indicators.push("Shopify");
    if (this.html.toLowerCase().includes("wix.com")) indicators.push("Wix");
    if (this.html.toLowerCase().includes("squarespace")) indicators.push("Squarespace");
    if (this.html.includes("fbq(")) indicators.push("Facebook Pixel");
    if (this.html.includes("gtag(") || this.html.includes("google-analytics"))
      indicators.push("Google Analytics");
    if (this.html.includes("googletagmanager")) indicators.push("Google Tag Manager");

    this.data.tech_detected = indicators;
    this.onProgress(`Tech: ${indicators.join(", ") || "None identified"}`);
  }
}
