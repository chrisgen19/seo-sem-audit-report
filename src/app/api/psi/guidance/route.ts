import { getOrgContext } from "@/lib/org";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/encrypt";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_MODEL } from "@/lib/constants";
import { z } from "zod";

const bodySchema = z.object({
  auditId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  score: z.number().nullable().optional(),
});

export async function POST(req: Request) {
  const ctx = await getOrgContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { auditId, title, description, score } = parsed.data;

  const user = await db.user.findUnique({ where: { id: ctx.userId } });
  if (!user?.geminiApiKey) {
    return Response.json({ error: "No Gemini API key configured. Go to Settings to add one." }, { status: 400 });
  }

  let apiKey: string;
  try {
    apiKey = decrypt(user.geminiApiKey);
  } catch {
    return Response.json({ error: "Failed to decrypt API key." }, { status: 500 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: user.geminiModel || GEMINI_MODEL });

  const scoreLabel =
    score == null ? "failed (no score)"
    : score >= 0.9 ? "passed"
    : score >= 0.5 ? "needs improvement"
    : "failing";

  // Strip markdown links from description for the prompt
  const plainDescription = description
    ? description.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    : "";

  const prompt = `You are a web performance and SEO expert. A Google Lighthouse audit flagged the following issue:

Audit: ${title} (ID: ${auditId})
Status: ${scoreLabel}${plainDescription ? `\nLighthouse description: ${plainDescription}` : ""}

Provide practical guidance covering:
1. What this audit checks and why it matters for performance and SEO (1–2 sentences)
2. How to fix it — specific, actionable steps a developer can follow
3. Expected impact if fixed (performance score, user experience, SEO)

Be concise and direct. Plain text only, no markdown formatting. Keep total response under 200 words.`;

  try {
    const result = await model.generateContent(prompt);
    const guidance = result.response.text().trim();
    return Response.json({ guidance });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
