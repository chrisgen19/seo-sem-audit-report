import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CLAUDE_MODEL, GEMINI_MODEL, TECHNICAL_CHECKS, CONTENT_CHECKS, SEM_CHECKS } from "./constants";

export type AnalyzeOptions = { model?: string | null };
import type { AnalysisResult, CrawlData } from "@/types/audit";

function buildChecklistPrompt(): string {
  const techNames = TECHNICAL_CHECKS.map(([n]) => `      "${n}"`).join("\n");
  const contentNames = CONTENT_CHECKS.map(([n]) => `      "${n}"`).join("\n");
  const semNames = SEM_CHECKS.map(([n]) => `      "${n}"`).join("\n");
  return `
TECHNICAL SEO — evaluate EXACTLY these ${TECHNICAL_CHECKS.length} checks (exact names, no additions, no omissions):
${techNames}

CONTENT SEO — evaluate EXACTLY these ${CONTENT_CHECKS.length} checks (exact names, no additions, no omissions):
${contentNames}

SEM READINESS — evaluate EXACTLY these ${SEM_CHECKS.length} checks (exact names, no additions, no omissions):
${semNames}
`;
}

const ANALYSIS_PROMPT = `You are an expert SEO/SEM auditor. I have crawled a website and extracted the following technical data. Based on this data, produce a comprehensive SEO & SEM audit.

## CRAWL DATA
\`\`\`json
{crawl_data}
\`\`\`

## FIXED CHECKLIST
You MUST evaluate exactly the checks listed below. Do NOT add new checks, rename checks, or skip any check. The check names must match EXACTLY as written.

{checklist}

## YOUR TASK
Respond ONLY with a valid JSON object (no markdown, no backticks, no preamble):

{
  "business_name": "detected business name",
  "business_description": "1-sentence description of what the business does",
  "executive_summary": "2-3 paragraphs covering key strengths and opportunities. Reference actual crawl data.",
  "key_strengths": "comma-separated list of strengths",
  "key_opportunities": "comma-separated list of opportunities",
  "technical_seo": {
    "score": 0,
    "grade": "N/A",
    "checks": [
      {
        "name": "EXACT check name from the fixed list above",
        "status": "PASS or WARN or FAIL",
        "finding": "Specific finding referencing actual crawl data",
        "recommendation": "Actionable recommendation"
      }
    ],
    "priority_actions": ["action 1 - be specific and actionable", "action 2", "action 3", "action 4", "action 5"]
  },
  "content_seo": {
    "score": 0,
    "grade": "N/A",
    "checks": [
      {
        "name": "EXACT check name from the fixed list above",
        "status": "PASS or WARN or FAIL",
        "finding": "Specific finding referencing actual crawl data",
        "recommendation": "Actionable recommendation"
      }
    ],
    "priority_actions": ["action 1", "action 2", "action 3", "action 4", "action 5"]
  },
  "sem_readiness": {
    "score": 0,
    "grade": "N/A",
    "checks": [
      {
        "name": "EXACT check name from the fixed list above",
        "status": "PASS or WARN or FAIL",
        "finding": "Specific finding referencing actual crawl data",
        "recommendation": "Actionable recommendation"
      }
    ],
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "issues": ["issue 1", "issue 2", "issue 3"],
    "ad_groups": [
      {
        "name": "Ad Group Name",
        "keywords": "keyword 1, keyword 2, keyword 3, keyword 4",
        "rationale": "Why this page is the right destination for these keywords"
      }
    ],
    "campaign_recommendations": ["recommendation 1", "recommendation 2", "recommendation 3", "recommendation 4", "recommendation 5"]
  },
  "overall_score": 0,
  "overall_grade": "N/A",
  "quick_wins": [
    {
      "rank": 1,
      "action": "What to do — be specific",
      "impact": "High/Medium/Low — with brief explanation",
      "effort": "High/Medium/Low — with brief explanation"
    }
  ]
}

CRITICAL RULES:
- The "checks" arrays must contain EXACTLY the named checks listed — same names, same count, no extras
- score and grade fields are placeholders (they will be calculated automatically) — set them to 0 and "N/A"
- Include AT LEAST 4 ad groups with 4+ keywords each
- Include AT LEAST 5 quick wins ranked by impact vs effort
- Be harsh but fair — do not inflate status; use FAIL if something is missing, WARN if partial/suboptimal
- Respond with ONLY the JSON object, nothing else

FINDING AND RECOMMENDATION QUALITY — THIS IS MANDATORY:
- Every "finding" should be a concise summary sentence that cites key numbers from the crawl data
  (e.g. counts, char lengths, response times). Do NOT list individual items — detailed item lists
  will be appended automatically from the crawl data after your response.
  GOOD: "5 of 19 images are missing alt text, primarily product and hero images."
  GOOD: "Title tag is 98 characters — 38 chars over the 60-char recommended limit."
  BAD:  "Title tag is too long" (too vague — cite the actual number)
  BAD:  "Images without alt text:\\n- image1.jpg\\n- image2.jpg" (don't list items — that's handled automatically)
- Every "recommendation" must be specific, step-by-step, and actionable for THIS site
- Recommendations should explain WHY the change matters (ranking signal, UX, CTR, etc.)`;

function parseJsonResponse(text: string): AnalysisResult {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/\s*```$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error(
      "Could not find JSON in AI response. Raw:\n" + cleaned.slice(0, 500)
    );
  }
  return JSON.parse(cleaned.slice(start, end + 1)) as AnalysisResult;
}

function buildPrompt(crawlData: CrawlData): string {
  // Build a summarized version of crawl data for the AI prompt.
  // The AI only needs enough to decide PASS/WARN/FAIL + write a summary.
  // Detailed item lists are appended by enrich.ts after the AI responds.
  const imgs = crawlData.images ?? [];
  const summarized = {
    // Page basics
    status_code: crawlData.status_code,
    final_url: crawlData.final_url,
    response_time_ms: crawlData.response_time_ms,
    content_length: crawlData.content_length,
    is_https: crawlData.is_https,
    has_mixed_content: crawlData.has_mixed_content,
    mixed_content_count: crawlData.mixed_content?.length ?? 0,

    // Meta
    title: crawlData.title,
    title_length: crawlData.title_length,
    meta_description: crawlData.meta_description,
    meta_description_length: crawlData.meta_description_length,
    meta_robots: crawlData.meta_robots,
    has_viewport: crawlData.has_viewport,
    html_lang: crawlData.html_lang,
    canonical_url: crawlData.canonical_url,
    has_canonical: crawlData.has_canonical,

    // Content (trimmed)
    word_count: crawlData.word_count,
    paragraph_count: crawlData.paragraph_count,
    duplicate_paragraph_count: crawlData.duplicate_paragraphs?.length ?? 0,
    headings: crawlData.headings,
    content_text: typeof crawlData.content_text === "string" && crawlData.content_text.length > 3000
      ? crawlData.content_text.slice(0, 3000) + "...[truncated]"
      : crawlData.content_text,

    // Links (counts + samples)
    internal_link_count: crawlData.internal_link_count,
    external_link_count: crawlData.external_link_count,
    has_phone_link: crawlData.has_phone_link,
    tel_links: crawlData.tel_links,

    // Images (summary only — enrich.ts handles the item list)
    image_count: crawlData.image_count,
    images_missing_alt: imgs.filter((i) => !i.has_alt).length,
    images_missing_lazy: imgs.filter((i) => !i.has_lazy_loading).length,
    images_missing_dims: imgs.filter((i) => !i.has_dimensions).length,
    images_placeholder: imgs.filter((i) => i.is_placeholder).length,

    // Schema
    schema_types: crawlData.schema_types,
    has_schema: crawlData.has_schema,

    // Forms (summary)
    form_count: crawlData.form_count,

    // Social tags (presence only)
    has_og_tags: crawlData.has_og_tags,
    has_twitter_tags: crawlData.has_twitter_tags,

    // Robots & sitemap
    robots_txt_status: crawlData.robots_txt_status,
    robots_txt_has_sitemap: crawlData.robots_txt_has_sitemap,
    sitemap_status: crawlData.sitemap_status,
    sitemap_url_count: crawlData.sitemap_url_count,
    sitemap_contains_target: crawlData.sitemap_contains_target,

    // Security headers (summary)
    security_headers_missing: crawlData.security_headers?.missing ?? [],

    // CTAs (summary)
    cta_count: crawlData.cta_elements?.length ?? 0,
    cta_samples: (crawlData.cta_elements ?? []).slice(0, 5).map((c) => c.text),

    // Trust signals
    trust_signals: crawlData.trust_signals,

    // Phone numbers in text
    phone_numbers_in_text: crawlData.phone_numbers_in_text,

    // FAQ
    faq_count: crawlData.faq_elements?.length ?? 0,

    // Conversion tracking
    conversion_tracking: crawlData.conversion_tracking,

    // Tech
    tech_detected: crawlData.tech_detected,
    external_script_count: crawlData.external_script_count,
    external_style_count: crawlData.external_style_count,
  };

  return ANALYSIS_PROMPT
    .replace("{crawl_data}", JSON.stringify(summarized, null, 2))
    .replace("{checklist}", buildChecklistPrompt());
}

export async function analyzeWithClaude(
  crawlData: CrawlData,
  apiKey: string,
  { model }: AnalyzeOptions = {}
): Promise<AnalysisResult> {
  const client = new Anthropic({ apiKey });
  const prompt = buildPrompt(crawlData);

  const message = await client.messages.create({
    model: model || CLAUDE_MODEL,
    max_tokens: 12000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  return parseJsonResponse(text);
}

export async function analyzeWithGemini(
  crawlData: CrawlData,
  apiKey: string,
  { model: modelOverride }: AnalyzeOptions = {}
): Promise<AnalysisResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelOverride || GEMINI_MODEL });
  const prompt = buildPrompt(crawlData);

  const result = await model.generateContent(prompt);
  return parseJsonResponse(result.response.text());
}
