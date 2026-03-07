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
- Every "finding" MUST start with a summary sentence, then list specific evidence from the crawl data
- Every "recommendation" must be specific, step-by-step, and actionable for THIS site
- Recommendations should explain WHY the change matters (ranking signal, UX, CTR, etc.)

DETAIL FORMAT — findings must use this structure:
  "<Summary sentence with counts/numbers>\\n\\nAffected items:\\n- item 1\\n- item 2\\n- item 3"

DETAIL REQUIREMENTS PER CHECK TYPE:
- Image checks (Image Optimization, Lazy Loading, Image Alt Text): List EACH affected image by its src filename/URL. Example:
  "5 of 19 images are missing alt text.\\n\\nImages without alt text:\\n- /images/hero-banner.jpg\\n- /images/product-1.webp\\n- /images/team-photo.png\\n- /images/logo-partner.svg\\n- /images/cta-bg.jpg"
- HTTP Security Headers: List EACH missing header by name, what it does, and its risk. Reference the security_headers.missing array.
- Link checks: Cite specific example URLs from the crawl data.
- Title/Meta/H1 checks: Quote the EXACT text from the crawl data, state char count, and state the optimal range.
- Structured Data: List the specific schema types found and which important ones are missing.
- Page Speed: Cite actual response_time_ms value and what threshold it exceeds.
- CTA/SEM checks: Reference specific cta_elements from the crawl data by their text.
- Trust Signals/Social Proof: Reference what the trust_signals data found or didn't find.
- Conversion Tracking: Reference the conversion_tracking.detected array — list what's present and what's missing.
- Phone/Contact: Reference tel_links and phone_numbers_in_text from the crawl data.
- FAQ/Rich Content: Reference faq_elements if present.
- Content Depth: Cite actual word_count, paragraph_count, and heading counts.
- Heading Hierarchy: List all headings found (H1, H2, H3) with their actual text.
- OG/Social Tags: List which OG/Twitter tags are present and which are missing.
- Duplicate Content: List any duplicate_paragraphs found.
- URL Structure: Analyze the actual URL path and structure from the crawl data.
- Robots.txt/Sitemap: Reference actual status codes and content from robots_txt_content and sitemap data.

BAD (too vague):  "Title tag is too long"
GOOD (detailed): "Title tag is 98 characters ('Equipment Hire & Sales | Supply Nation | Access Indigenous') — 38 chars over the 60-char recommended limit. Search engines will truncate this in SERPs."

BAD:  "Some images lack lazy loading"
GOOD: "All 19 images have has_lazy_loading: false.\\n\\nImages not lazy-loaded:\\n- /images/excavator-hero.jpg (format: jpg)\\n- /images/scissor-lift.webp (format: webp)\\n- /images/team.png (format: png)\\n\\nThis is especially impactful as several are large product photos below the fold."`;

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
  const trimmed = { ...crawlData };
  if (typeof trimmed.content_text === "string" && trimmed.content_text.length > 4000) {
    trimmed.content_text = trimmed.content_text.slice(0, 4000) + "...[truncated]";
  }
  return ANALYSIS_PROMPT
    .replace("{crawl_data}", JSON.stringify(trimmed, null, 2))
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
