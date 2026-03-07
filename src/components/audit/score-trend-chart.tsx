"use client";

import { useState, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatDate } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AuditRunSummary {
  id: string;
  createdAt: string | Date;
  overallScore: number | null;
  technicalScore: number | null;
  contentScore: number | null;
  semScore: number | null;
  psiMobile?: number | null;
  psiDesktop?: number | null;
}

interface ScoreTrendChartProps {
  runs: AuditRunSummary[];
}

const SERIES = [
  { key: "Overall", color: "#1F4E79", label: "Overall" },
  { key: "Technical", color: "#2196F3", label: "Technical" },
  { key: "Content", color: "#27AE60", label: "Content" },
  { key: "SEM", color: "#F39C12", label: "SEM" },
  { key: "PSI Mobile", color: "#E74C3C", label: "PSI Mobile" },
  { key: "PSI Desktop", color: "#9B59B6", label: "PSI Desktop" },
] as const;

export function ScoreTrendChart({ runs }: ScoreTrendChartProps) {
  const [activeLines, setActiveLines] = useState<Set<string>>(
    () => new Set(SERIES.map((s) => s.key))
  );

  const toggleLine = useCallback((key: string) => {
    setActiveLines((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  if (runs.length < 2) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        Run at least 2 audits to see the trend chart.
      </div>
    );
  }

  const data = runs
    .filter((r) => r.overallScore !== null)
    .map((r) => ({
      date: formatDate(r.createdAt),
      Overall: r.overallScore,
      Technical: r.technicalScore,
      Content: r.contentScore,
      SEM: r.semScore,
      "PSI Mobile": r.psiMobile ?? undefined,
      "PSI Desktop": r.psiDesktop ?? undefined,
    }));

  const hasPsiMobile = data.some((d) => d["PSI Mobile"] !== undefined);
  const hasPsiDesktop = data.some((d) => d["PSI Desktop"] !== undefined);

  const visibleSeries = SERIES.filter((s) => {
    if (s.key === "PSI Mobile" && !hasPsiMobile) return false;
    if (s.key === "PSI Desktop" && !hasPsiDesktop) return false;
    return true;
  });

  return (
    <div className="space-y-3">
      {/* Interactive legend */}
      <div className="flex flex-wrap gap-2">
        {visibleSeries.map((s) => {
          const isActive = activeLines.has(s.key);
          return (
            <button
              key={s.key}
              onClick={() => toggleLine(s.key)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? "bg-gray-100 text-gray-800 shadow-sm"
                  : "bg-gray-50 text-gray-400"
              }`}
            >
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0 transition-opacity"
                style={{
                  backgroundColor: s.color,
                  opacity: isActive ? 1 : 0.3,
                }}
              />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <defs>
            {visibleSeries.map((s) => (
              <linearGradient key={s.key} id={`gradient-${s.key.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={s.key === "Overall" ? 0.15 : 0.08} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            tickCount={6}
          />
          <Tooltip content={<CustomTooltip visibleSeries={visibleSeries} />} />
          {visibleSeries.map((s) => (
            activeLines.has(s.key) && (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={s.key === "Overall" ? 2.5 : 1.5}
                fill={`url(#gradient-${s.key.replace(/\s/g, "")})`}
                dot={{ r: s.key === "Overall" ? 4 : 3, fill: s.color, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, fill: s.color, strokeWidth: 2, stroke: "#fff" }}
                connectNulls
                animationDuration={600}
              />
            )
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
  visibleSeries,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: string;
  visibleSeries: typeof SERIES extends ReadonlyArray<infer T> ? T[] : never;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg px-4 py-3 min-w-[180px]">
      <p className="text-xs font-semibold text-gray-500 mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry) => {
          const series = visibleSeries.find((s) => s.key === entry.dataKey);
          return (
            <div key={entry.dataKey} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-gray-600">{series?.label ?? entry.dataKey}</span>
              </div>
              <span className="text-xs font-bold text-gray-900">
                {entry.value !== undefined ? entry.value : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Score summary cards used by the parent page
export interface ScoreSummary {
  label: string;
  current: number | null;
  previous: number | null;
  color: string;
}

export function ScoreSummaryRow({ scores }: { scores: ScoreSummary[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {scores.map((s) => (
        <ScoreMiniCard key={s.label} {...s} />
      ))}
    </div>
  );
}

function ScoreMiniCard({ label, current, previous, color }: ScoreSummary) {
  if (current === null) {
    return (
      <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-lg font-bold text-gray-300">—</p>
      </div>
    );
  }

  const delta = previous !== null ? current - previous : null;
  const scoreColor =
    current >= 80 ? "text-green-600" : current >= 60 ? "text-amber-600" : "text-red-600";

  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5 group hover:border-gray-200 transition-colors">
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <p className="text-xs text-gray-500 font-medium">{label}</p>
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-xl font-bold ${scoreColor}`}>{current}</span>
        {delta !== null && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-semibold mb-0.5 ${
              delta > 0 ? "text-green-600" : delta < 0 ? "text-red-500" : "text-gray-400"
            }`}
          >
            {delta > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : delta < 0 ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {delta > 0 ? `+${delta}` : delta === 0 ? "0" : delta}
          </span>
        )}
      </div>
    </div>
  );
}
