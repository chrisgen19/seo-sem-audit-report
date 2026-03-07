"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatDate } from "@/lib/utils";

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

export function ScoreTrendChart({ runs }: ScoreTrendChartProps) {
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

  // Only show PSI lines if at least one run has PSI data
  const hasPsiMobile = data.some((d) => d["PSI Mobile"] !== undefined);
  const hasPsiDesktop = data.some((d) => d["PSI Desktop"] !== undefined);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
        />
        <Legend iconType="circle" iconSize={8} />
        <Line
          type="monotone"
          dataKey="Overall"
          stroke="#1F4E79"
          strokeWidth={2.5}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="Technical"
          stroke="#2196F3"
          strokeWidth={1.5}
          dot={{ r: 3 }}
          strokeDasharray="4 2"
        />
        <Line
          type="monotone"
          dataKey="Content"
          stroke="#27AE60"
          strokeWidth={1.5}
          dot={{ r: 3 }}
          strokeDasharray="4 2"
        />
        <Line
          type="monotone"
          dataKey="SEM"
          stroke="#F39C12"
          strokeWidth={1.5}
          dot={{ r: 3 }}
          strokeDasharray="4 2"
        />
        {hasPsiMobile && (
          <Line
            type="monotone"
            dataKey="PSI Mobile"
            stroke="#E74C3C"
            strokeWidth={1.5}
            dot={{ r: 3 }}
            strokeDasharray="6 3"
            connectNulls
          />
        )}
        {hasPsiDesktop && (
          <Line
            type="monotone"
            dataKey="PSI Desktop"
            stroke="#9B59B6"
            strokeWidth={1.5}
            dot={{ r: 3 }}
            strokeDasharray="6 3"
            connectNulls
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
