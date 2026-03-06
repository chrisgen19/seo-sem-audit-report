import {
  TECHNICAL_CHECKS,
  CONTENT_CHECKS,
  SEM_CHECKS,
  STATUS_VALUES,
} from "./constants";
import type { AnalysisResult, AuditCheckInput } from "@/types/audit";

function grade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

function scoreSection(
  rubric: [string, number][],
  checks: AuditCheckInput[]
): number {
  const lookup = new Map(checks.map((c) => [c.name.trim(), c]));
  const totalWeight = rubric.reduce((sum, [, w]) => sum + w, 0);
  const earned = rubric.reduce((sum, [name, weight]) => {
    const check = lookup.get(name);
    const status = (check?.status ?? "FAIL").toUpperCase();
    return sum + weight * (STATUS_VALUES[status] ?? 0);
  }, 0);
  return totalWeight ? Math.round((earned / totalWeight) * 100) : 0;
}

/**
 * Overrides AI-assigned scores with deterministic rubric-based scores.
 * This ensures scores are always comparable across runs and providers.
 */
export function computeScores(analysis: AnalysisResult): AnalysisResult {
  const techScore = scoreSection(
    TECHNICAL_CHECKS,
    analysis.technical_seo.checks
  );
  const contentScore = scoreSection(
    CONTENT_CHECKS,
    analysis.content_seo.checks
  );
  const semScore = scoreSection(SEM_CHECKS, analysis.sem_readiness.checks);

  // Overall: Technical 40%, Content 35%, SEM 25%
  const overall = Math.round(
    techScore * 0.4 + contentScore * 0.35 + semScore * 0.25
  );

  return {
    ...analysis,
    technical_seo: {
      ...analysis.technical_seo,
      score: techScore,
      grade: grade(techScore),
    },
    content_seo: {
      ...analysis.content_seo,
      score: contentScore,
      grade: grade(contentScore),
    },
    sem_readiness: {
      ...analysis.sem_readiness,
      score: semScore,
      grade: grade(semScore),
    },
    overall_score: overall,
    overall_grade: grade(overall),
  };
}
