import { cn, gradeColor, scoreBg } from "@/lib/utils";

interface ScoreCardProps {
  label: string;
  score: number;
  grade: string;
  previousScore?: number;
  className?: string;
}

export function ScoreCard({ label, score, grade, previousScore, className }: ScoreCardProps) {
  const delta = previousScore !== undefined ? score - previousScore : null;

  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 p-5", className)}>
      <p className="text-sm font-medium text-gray-500 mb-2">{label}</p>
      <div className="flex items-end gap-3">
        <span className="text-4xl font-bold text-gray-900">{score}</span>
        <span className="text-lg text-gray-400 mb-1">/ 100</span>
        <span
          className={cn(
            "text-2xl font-bold mb-1",
            gradeColor(grade)
          )}
        >
          {grade}
        </span>
      </div>

      {/* Score bar */}
      <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            score >= 80 ? "bg-green-500" : score >= 60 ? "bg-amber-500" : "bg-red-500"
          )}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Delta vs previous */}
      {delta !== null && (
        <p
          className={cn(
            "text-xs font-medium mt-2",
            delta > 0 ? "text-green-600" : delta < 0 ? "text-red-600" : "text-gray-400"
          )}
        >
          {delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : "="} vs previous run
        </p>
      )}
    </div>
  );
}

interface ScoreBadgeProps {
  score: number;
}

export function ScoreBadge({ score }: ScoreBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold",
        scoreBg(score)
      )}
    >
      {score}
    </span>
  );
}
