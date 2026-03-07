"use client";

import { useState } from "react";
import type { PsiResult, PsiAuditItem } from "@/types/audit";
import { ChevronDown, ChevronRight } from "lucide-react";

interface PsiSectionProps {
  mobile?: PsiResult | null;
  desktop?: PsiResult | null;
  psiError?: string | null;
}

export function PsiSection({ mobile, desktop, psiError }: PsiSectionProps) {
  const [tab, setTab] = useState<"mobile" | "desktop">("mobile");

  if (!mobile && !desktop) {
    if (psiError) {
      return (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          PageSpeed Insights unavailable: {psiError}
        </div>
      );
    }
    return null;
  }

  const current = tab === "mobile" ? mobile : desktop;

  return (
    <div className="space-y-4">
      {/* Tab toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {mobile && (
          <button
            onClick={() => setTab("mobile")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === "mobile"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Mobile
          </button>
        )}
        {desktop && (
          <button
            onClick={() => setTab("desktop")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === "desktop"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Desktop
          </button>
        )}
      </div>

      {current ? (
        <>
          {/* Score + Metrics */}
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <ScoreGauge score={current.performance_score} />
            <MetricsGrid psi={current} />
          </div>

          {/* Audit items */}
          <AuditItemsList audits={current.audits} />
        </>
      ) : (
        <p className="text-sm text-gray-400">
          No data available for {tab} strategy.
        </p>
      )}
    </div>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 90 ? "#0cce6b" : score >= 50 ? "#ffa400" : "#ff4e42";
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center shrink-0">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          className="transition-all duration-700"
        />
        <text
          x="60"
          y="60"
          textAnchor="middle"
          dominantBaseline="central"
          className="text-3xl font-bold"
          fill={color}
          fontSize="32"
          fontWeight="bold"
        >
          {score}
        </text>
      </svg>
      <p className="text-sm font-medium text-gray-500 mt-1">Performance</p>
    </div>
  );
}

function MetricsGrid({ psi }: { psi: PsiResult }) {
  const metrics = [
    { label: "First Contentful Paint", value: formatMs(psi.fcp), rating: psi.fcp_rating },
    { label: "Largest Contentful Paint", value: formatMs(psi.lcp), rating: psi.lcp_rating },
    { label: "Total Blocking Time", value: `${psi.tbt} ms`, rating: psi.tbt_rating },
    { label: "Cumulative Layout Shift", value: String(psi.cls), rating: psi.cls_rating },
    { label: "Speed Index", value: formatMs(psi.si), rating: psi.si_rating },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
      {metrics.map((m) => (
        <div key={m.label} className="space-y-1">
          <div className="flex items-center gap-2">
            <RatingDot rating={m.rating} />
            <p className="text-xs font-medium text-gray-500">{m.label}</p>
          </div>
          <p className={`text-lg font-bold ${ratingTextColor(m.rating)}`}>
            {m.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function AuditItemsList({ audits }: { audits: PsiAuditItem[] }) {
  const opportunities = audits.filter((a) => a.group === "opportunity");
  const diagnostics = audits.filter((a) => a.group === "diagnostic");
  const passed = audits.filter((a) => a.group === "passed");

  return (
    <div className="space-y-4">
      {opportunities.length > 0 && (
        <AuditGroup title="Opportunities" items={opportunities} defaultOpen />
      )}
      {diagnostics.length > 0 && (
        <AuditGroup title="Diagnostics" items={diagnostics} defaultOpen />
      )}
      {passed.length > 0 && (
        <AuditGroup title="Passed Audits" items={passed} defaultOpen={false} />
      )}
    </div>
  );
}

function AuditGroup({
  title,
  items,
  defaultOpen = true,
}: {
  title: string;
  items: PsiAuditItem[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 mb-2"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        {title} ({items.length})
      </button>
      {open && (
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <AuditIcon item={item} />
              <span className="font-medium text-gray-900">{item.title}</span>
              {item.displayValue && (
                <span className="text-gray-400 ml-auto shrink-0">
                  {item.displayValue}
                </span>
              )}
              {(item.savings_ms || item.savings_bytes) && (
                <span className="text-red-500 text-xs font-medium ml-auto shrink-0">
                  {item.savings_ms
                    ? `Est savings of ${formatSavingsMs(item.savings_ms)}`
                    : `Est savings of ${formatBytes(item.savings_bytes!)}`}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuditIcon({ item }: { item: PsiAuditItem }) {
  if (item.group === "passed") {
    return <span className="inline-block w-3 h-3 rounded-full border-2 border-gray-300 shrink-0" />;
  }
  const color = item.score !== null && item.score >= 0.5 ? "text-amber-500" : "text-red-500";
  if (item.group === "opportunity") {
    return (
      <span className={`${color} text-xs shrink-0`}>
        {item.score !== null && item.score >= 0.5 ? "■" : "▲"}
      </span>
    );
  }
  return (
    <span className={`${color} text-xs shrink-0`}>
      {item.score !== null && item.score >= 0.5 ? "■" : "▲"}
    </span>
  );
}

function RatingDot({ rating }: { rating: string }) {
  const color =
    rating === "FAST" ? "bg-green-500" : rating === "AVERAGE" ? "bg-amber-500" : "bg-red-500";
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color} shrink-0`} />;
}

function ratingTextColor(rating: string): string {
  if (rating === "FAST") return "text-green-600";
  if (rating === "AVERAGE") return "text-amber-600";
  return "text-red-600";
}

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)} s`;
  return `${ms} ms`;
}

function formatSavingsMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)} s`;
  return `${ms} ms`;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KiB`;
  return `${bytes} B`;
}
