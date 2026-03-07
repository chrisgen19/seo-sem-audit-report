/** Helpful documentation and tool links for common Lighthouse / PSI audit IDs. */

interface PsiResource {
  label: string;
  url: string;
}

export const PSI_AUDIT_RESOURCES: Record<string, PsiResource[]> = {
  // ── Loading Performance ────────────────────────────────────────
  "render-blocking-resources": [
    { label: "web.dev — Eliminate render-blocking resources", url: "https://web.dev/articles/render-blocking-resources" },
    { label: "Chrome Developers — Critical rendering path", url: "https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources" },
  ],
  "unused-css-rules": [
    { label: "web.dev — Remove unused CSS", url: "https://web.dev/articles/unused-css-rules" },
    { label: "Chrome DevTools — Coverage tab", url: "https://developer.chrome.com/docs/devtools/coverage" },
  ],
  "unused-javascript": [
    { label: "web.dev — Remove unused JavaScript", url: "https://web.dev/articles/unused-javascript" },
    { label: "Chrome DevTools — Coverage tab", url: "https://developer.chrome.com/docs/devtools/coverage" },
  ],
  "unminified-css": [
    { label: "web.dev — Minify CSS", url: "https://web.dev/articles/unminified-css" },
    { label: "Chrome Developers — Minify CSS", url: "https://developer.chrome.com/docs/lighthouse/performance/unminified-css" },
  ],
  "unminified-javascript": [
    { label: "web.dev — Minify JavaScript", url: "https://web.dev/articles/unminified-javascript" },
    { label: "Chrome Developers — Minify JS", url: "https://developer.chrome.com/docs/lighthouse/performance/unminified-javascript" },
  ],
  "uses-text-compression": [
    { label: "web.dev — Enable text compression", url: "https://web.dev/articles/uses-text-compression" },
    { label: "Chrome Developers — Text compression", url: "https://developer.chrome.com/docs/lighthouse/performance/uses-text-compression" },
  ],
  "server-response-time": [
    { label: "web.dev — Reduce server response times (TTFB)", url: "https://web.dev/articles/ttfb" },
    { label: "Chrome Developers — Server response time", url: "https://developer.chrome.com/docs/lighthouse/performance/time-to-first-byte" },
  ],
  "redirects": [
    { label: "web.dev — Avoid multiple page redirects", url: "https://web.dev/articles/redirects" },
    { label: "Chrome Developers — Redirects", url: "https://developer.chrome.com/docs/lighthouse/performance/redirects" },
  ],
  "uses-rel-preconnect": [
    { label: "web.dev — Preconnect to required origins", url: "https://web.dev/articles/uses-rel-preconnect" },
    { label: "MDN — rel=preconnect", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preconnect" },
  ],
  "uses-rel-preload": [
    { label: "web.dev — Preload key requests", url: "https://web.dev/articles/uses-rel-preload" },
    { label: "MDN — rel=preload", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload" },
  ],
  "critical-request-chains": [
    { label: "web.dev — Critical request chains", url: "https://web.dev/articles/critical-request-chains" },
    { label: "Chrome Developers — Critical request chains", url: "https://developer.chrome.com/docs/lighthouse/performance/critical-request-chains" },
  ],

  // ── Images ─────────────────────────────────────────────────────
  "modern-image-formats": [
    { label: "web.dev — Use modern image formats", url: "https://web.dev/articles/uses-webp-images" },
    { label: "Squoosh — Image optimizer", url: "https://squoosh.app/" },
    { label: "web.dev — Choose the right image format", url: "https://web.dev/articles/choose-the-right-image-format" },
  ],
  "uses-optimized-images": [
    { label: "web.dev — Efficiently encode images", url: "https://web.dev/articles/uses-optimized-images" },
    { label: "Squoosh — Image optimizer", url: "https://squoosh.app/" },
  ],
  "uses-responsive-images": [
    { label: "web.dev — Properly size images", url: "https://web.dev/articles/uses-responsive-images" },
    { label: "web.dev — Serve responsive images", url: "https://web.dev/articles/serve-responsive-images" },
  ],
  "offscreen-images": [
    { label: "web.dev — Defer offscreen images", url: "https://web.dev/articles/offscreen-images" },
    { label: "MDN — Lazy loading", url: "https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading" },
  ],
  "efficient-animated-content": [
    { label: "web.dev — Use video formats for animated content", url: "https://web.dev/articles/efficient-animated-content" },
    { label: "Chrome Developers — Animated content", url: "https://developer.chrome.com/docs/lighthouse/performance/efficient-animated-content" },
  ],
  "unsized-images": [
    { label: "web.dev — Image elements have explicit dimensions", url: "https://web.dev/articles/optimize-cls#images-without-dimensions" },
    { label: "MDN — img width/height", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#width" },
  ],
  "image-size-responsive": [
    { label: "web.dev — Serve responsive images", url: "https://web.dev/articles/serve-responsive-images" },
  ],

  // ── Core Web Vitals ────────────────────────────────────────────
  "largest-contentful-paint-element": [
    { label: "web.dev — Optimize LCP", url: "https://web.dev/articles/optimize-lcp" },
    { label: "web.dev — LCP metric", url: "https://web.dev/articles/lcp" },
  ],
  "lcp-lazy-loaded": [
    { label: "web.dev — LCP image was lazily loaded", url: "https://web.dev/articles/optimize-lcp#optimal_loading_strategies" },
    { label: "Chrome Developers — LCP lazy loaded", url: "https://developer.chrome.com/docs/lighthouse/performance/lcp-lazy-loaded" },
  ],
  "total-blocking-time": [
    { label: "web.dev — Total Blocking Time", url: "https://web.dev/articles/tbt" },
    { label: "web.dev — Optimize long tasks", url: "https://web.dev/articles/optimize-long-tasks" },
  ],
  "cumulative-layout-shift": [
    { label: "web.dev — Optimize CLS", url: "https://web.dev/articles/optimize-cls" },
    { label: "web.dev — CLS metric", url: "https://web.dev/articles/cls" },
  ],
  "layout-shifts": [
    { label: "web.dev — Optimize CLS", url: "https://web.dev/articles/optimize-cls" },
    { label: "web.dev — Debug layout shifts", url: "https://web.dev/articles/debug-layout-shifts" },
  ],
  "layout-shift-elements": [
    { label: "web.dev — Optimize CLS", url: "https://web.dev/articles/optimize-cls" },
    { label: "web.dev — Debug layout shifts", url: "https://web.dev/articles/debug-layout-shifts" },
  ],
  "first-contentful-paint": [
    { label: "web.dev — First Contentful Paint", url: "https://web.dev/articles/fcp" },
  ],
  "speed-index": [
    { label: "web.dev — Speed Index", url: "https://web.dev/articles/speed-index" },
  ],
  "interactive": [
    { label: "web.dev — Time to Interactive", url: "https://web.dev/articles/tti" },
  ],
  "max-potential-fid": [
    { label: "web.dev — First Input Delay", url: "https://web.dev/articles/fid" },
  ],

  // ── JavaScript ─────────────────────────────────────────────────
  "bootup-time": [
    { label: "web.dev — Reduce JavaScript execution time", url: "https://web.dev/articles/bootup-time" },
    { label: "Chrome Developers — JS execution time", url: "https://developer.chrome.com/docs/lighthouse/performance/bootup-time" },
  ],
  "mainthread-work-breakdown": [
    { label: "web.dev — Minimize main-thread work", url: "https://web.dev/articles/mainthread-work-breakdown" },
    { label: "Chrome Developers — Main-thread work", url: "https://developer.chrome.com/docs/lighthouse/performance/mainthread-work-breakdown" },
  ],
  "legacy-javascript": [
    { label: "web.dev — Avoid serving legacy JS to modern browsers", url: "https://web.dev/articles/publish-modern-javascript" },
    { label: "Chrome Developers — Legacy JavaScript", url: "https://developer.chrome.com/docs/lighthouse/performance/legacy-javascript" },
  ],
  "duplicated-javascript": [
    { label: "Chrome Developers — Duplicated JavaScript", url: "https://developer.chrome.com/docs/lighthouse/performance/duplicated-javascript" },
    { label: "web.dev — Remove duplicate modules", url: "https://web.dev/articles/reduce-javascript-payloads-with-tree-shaking" },
  ],
  "long-tasks": [
    { label: "web.dev — Optimize long tasks", url: "https://web.dev/articles/optimize-long-tasks" },
    { label: "MDN — Long Tasks API", url: "https://developer.mozilla.org/en-US/docs/Web/API/PerformanceLongTaskTiming" },
  ],
  "third-party-summary": [
    { label: "web.dev — Third-party scripts impact", url: "https://web.dev/articles/optimizing-content-efficiency-loading-third-party-javascript" },
    { label: "Chrome Developers — Third-party summary", url: "https://developer.chrome.com/docs/lighthouse/performance/third-party-summary" },
  ],
  "third-party-facades": [
    { label: "web.dev — Lazy-load third-party resources with facades", url: "https://web.dev/articles/third-party-facades" },
  ],

  // ── DOM & Network ──────────────────────────────────────────────
  "dom-size": [
    { label: "web.dev — Avoid excessive DOM size", url: "https://web.dev/articles/dom-size" },
    { label: "Chrome Developers — DOM size", url: "https://developer.chrome.com/docs/lighthouse/performance/dom-size" },
  ],
  "total-byte-weight": [
    { label: "web.dev — Avoid enormous network payloads", url: "https://web.dev/articles/total-byte-weight" },
    { label: "Chrome Developers — Network payloads", url: "https://developer.chrome.com/docs/lighthouse/performance/total-byte-weight" },
  ],
  "uses-long-cache-ttl": [
    { label: "web.dev — Serve static assets with efficient cache policy", url: "https://web.dev/articles/uses-long-cache-ttl" },
    { label: "MDN — HTTP caching", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching" },
  ],
  "uses-http2": [
    { label: "web.dev — Use HTTP/2", url: "https://web.dev/articles/performance-http2" },
    { label: "Chrome Developers — HTTP/2", url: "https://developer.chrome.com/docs/lighthouse/best-practices/uses-http2" },
  ],

  // ── Fonts ──────────────────────────────────────────────────────
  "font-display": [
    { label: "web.dev — Ensure text is visible during webfont load", url: "https://web.dev/articles/font-display" },
    { label: "MDN — font-display", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display" },
  ],
  "font-size": [
    { label: "Chrome Developers — Legible font sizes", url: "https://developer.chrome.com/docs/lighthouse/seo/font-size" },
  ],

  // ── Accessibility-adjacent ─────────────────────────────────────
  "viewport": [
    { label: "web.dev — Responsive viewport meta tag", url: "https://web.dev/articles/responsive-web-design-basics#viewport" },
    { label: "MDN — Viewport meta tag", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag" },
  ],
  "document-title": [
    { label: "Chrome Developers — Document title", url: "https://developer.chrome.com/docs/lighthouse/seo/document-title" },
  ],
  "meta-description": [
    { label: "Chrome Developers — Meta description", url: "https://developer.chrome.com/docs/lighthouse/seo/meta-description" },
  ],
  "is-crawlable": [
    { label: "Chrome Developers — Page is blocked from indexing", url: "https://developer.chrome.com/docs/lighthouse/seo/is-crawlable" },
    { label: "Google — Robots meta tag", url: "https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag" },
  ],

  // ── Forced reflow / paint ──────────────────────────────────────
  "forced-reflow": [
    { label: "web.dev — Avoid forced reflows", url: "https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing" },
    { label: "Chrome Developers — Forced reflow", url: "https://developer.chrome.com/docs/devtools/performance#rendering" },
  ],
  "non-composited-animations": [
    { label: "web.dev — Avoid non-composited animations", url: "https://web.dev/articles/animations-guide" },
    { label: "Chrome Developers — Compositing", url: "https://developer.chrome.com/blog/inside-browser-part3" },
  ],

  // ── Best Practices ─────────────────────────────────────────────
  "no-document-write": [
    { label: "web.dev — Avoid document.write()", url: "https://web.dev/articles/no-document-write" },
    { label: "Chrome Developers — document.write()", url: "https://developer.chrome.com/docs/lighthouse/best-practices/no-document-write" },
  ],
  "uses-passive-event-listeners": [
    { label: "web.dev — Use passive listeners", url: "https://web.dev/articles/uses-passive-event-listeners" },
    { label: "Chrome Developers — Passive listeners", url: "https://developer.chrome.com/docs/lighthouse/best-practices/uses-passive-event-listeners" },
  ],

  // ── LCP sub-parts ──────────────────────────────────────────────
  "prioritize-lcp-image": [
    { label: "web.dev — Optimize LCP", url: "https://web.dev/articles/optimize-lcp" },
    { label: "web.dev — Priority Hints", url: "https://web.dev/articles/priority-hints" },
  ],
  "lcp-discovery": [
    { label: "web.dev — Optimize LCP", url: "https://web.dev/articles/optimize-lcp" },
  ],
};
