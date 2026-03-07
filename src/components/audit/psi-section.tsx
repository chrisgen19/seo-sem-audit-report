"use client";

import { useState } from "react";
import type { PsiResult, PsiAuditItem, PsiDetailHeading, PsiDetailItem } from "@/types/audit";
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
  const sortByScore = (a: PsiAuditItem, b: PsiAuditItem) => (a.score ?? -1) - (b.score ?? -1);
  const opportunities = audits.filter((a) => a.group === "opportunity").sort(sortByScore);
  const diagnostics = audits.filter((a) => a.group === "diagnostic").sort(sortByScore);
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
            <AuditItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function AuditItemRow({ item }: { item: PsiAuditItem }) {
  const hasDetails = item.details && item.details.items.length > 0;
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        onClick={() => hasDetails && setExpanded((v) => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left ${
          hasDetails ? "cursor-pointer hover:bg-gray-50" : "cursor-default"
        }`}
      >
        <AuditIcon item={item} />
        <span className="font-medium text-gray-900 flex-1 min-w-0">
          {item.title}
        </span>
        {item.displayValue && (
          <span className="text-gray-400 shrink-0">
            {item.displayValue}
          </span>
        )}
        {(item.savings_ms || item.savings_bytes) && (
          <span className="text-red-500 text-xs font-medium shrink-0">
            {item.savings_ms
              ? `Est savings of ${formatSavingsMs(item.savings_ms)}`
              : `Est savings of ${formatBytes(item.savings_bytes!)}`}
          </span>
        )}
        {hasDetails && (
          <span className="text-gray-400 shrink-0 ml-1">
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
        )}
      </button>

      {expanded && item.details && (
        <div className="px-4 pb-3">
          {item.description && (
            <p className="text-xs text-gray-500 mb-2">{item.description}</p>
          )}
          <DetailTable
            headings={item.details.headings}
            items={item.details.items}
          />
        </div>
      )}
    </div>
  );
}

function DetailTable({
  headings,
  items,
}: {
  headings: PsiDetailHeading[];
  items: PsiDetailItem[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {headings.map((h) => (
              <th
                key={h.key}
                className="text-left px-3 py-2 font-medium text-gray-600 whitespace-nowrap"
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {headings.map((h) => (
                <td key={h.key} className="px-3 py-2 text-gray-700">
                  <DetailCell value={row[h.key]} valueType={h.valueType} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DetailCell({
  value,
  valueType,
}: {
  value: unknown;
  valueType?: string;
}) {
  if (value === null || value === undefined) {
    return <span className="text-gray-300">—</span>;
  }

  // Handle object values (e.g., { type: "url", value: "..." })
  if (typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if (obj.type === "url" && typeof obj.value === "string") {
      return <UrlCell url={obj.value} />;
    }
    if (typeof obj.url === "string") {
      return <UrlCell url={obj.url} />;
    }
    if (typeof obj.value === "string" || typeof obj.value === "number") {
      return <DetailCell value={obj.value} valueType={valueType} />;
    }
    return <span className="text-gray-400">{JSON.stringify(value)}</span>;
  }

  if (valueType === "bytes" && typeof value === "number") {
    return <span className="whitespace-nowrap">{formatBytes(value)}</span>;
  }

  if (valueType === "ms" && typeof value === "number") {
    return <span className="whitespace-nowrap">{formatSavingsMs(value)}</span>;
  }

  if (valueType === "timespanMs" && typeof value === "number") {
    return <span className="whitespace-nowrap">{formatMs(value)}</span>;
  }

  if (valueType === "numeric" && typeof value === "number") {
    return <span>{value.toLocaleString()}</span>;
  }

  if (valueType === "url" && typeof value === "string") {
    return <UrlCell url={value} />;
  }

  if (valueType === "thumbnail" && typeof value === "string") {
    return <span className="text-gray-400 truncate max-w-[200px] inline-block">(image)</span>;
  }

  if (typeof value === "string") {
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return <UrlCell url={value} />;
    }
    return <span className="break-all">{value}</span>;
  }

  return <span>{String(value)}</span>;
}

function UrlCell({ url }: { url: string }) {
  let display: string;
  try {
    const u = new URL(url);
    display = u.pathname + u.search;
    if (display.length > 60) display = display.slice(0, 57) + "...";
  } catch {
    display = url.length > 60 ? url.slice(0, 57) + "..." : url;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand-700 hover:text-brand-900 hover:underline break-all max-w-[300px] inline-block truncate"
      title={url}
    >
      {display}
    </a>
  );
}

function AuditIcon({ item }: { item: PsiAuditItem }) {
  if (item.group === "passed") {
    return <span className="inline-block w-3 h-3 rounded-full border-2 border-gray-300 shrink-0" />;
  }
  const color = item.score !== null && item.score >= 0.5 ? "text-amber-500" : "text-red-500";
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
