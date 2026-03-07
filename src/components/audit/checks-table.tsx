"use client";

import React, { useState, useEffect } from "react";
import { statusBadgeClass, cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Rows3, Layers, ExternalLink } from "lucide-react";
import { CHECK_RESOURCES } from "@/lib/check-resources";

type GroupMode = "per-row" | "per-group";
type StatusFilter = "ALL" | "FAIL" | "WARN" | "PASS";

const STORAGE_KEY = "checksTableMode";
const STATUS_ORDER: Record<string, number> = { FAIL: 0, WARN: 1, PASS: 2 };

interface Check {
  name: string;
  status: string;
  finding: string;
  recommendation: string;
}

interface ChecksTableProps {
  checks: Check[];
}

function truncate(text: string, max = 100) {
  // For truncated view, only show the first line/sentence (before bullet lists)
  const firstLine = text.split("\n")[0];
  const clean = firstLine.length <= max ? firstLine : firstLine.slice(0, max).trimEnd() + "…";
  return clean;
}

/** Renders finding text with proper newlines, bullet points, and structure */
function FormattedFinding({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith("- ")) {
          return (
            <div key={i} className="flex gap-1.5 pl-2">
              <span className="text-gray-400 shrink-0">•</span>
              <span className="text-gray-600 text-sm break-all">{trimmed.slice(2)}</span>
            </div>
          );
        }
        return (
          <p key={i} className="text-gray-700 text-sm">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

function ResourceLinks({ checkName }: { checkName: string }) {
  const resources = CHECK_RESOURCES[checkName];
  if (!resources?.length) return null;
  return (
    <div className="mt-2 pt-2 border-t border-gray-200">
      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
        Helpful Resources
      </span>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {resources.map((r) => (
          <a
            key={r.url}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
          >
            <ExternalLink className="h-3 w-3 shrink-0" />
            {r.label}
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Per-row mode ──────────────────────────────────────────────────────────────

function PerRowTable({ checks }: { checks: Check[] }) {
  const [openRows, setOpenRows] = useState<Set<number>>(new Set());

  function toggle(i: number) {
    setOpenRows((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 font-semibold text-gray-700 w-8" />
            <th className="text-left px-4 py-3 font-semibold text-gray-700 w-48">Check</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-700 w-20">Status</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Finding</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {checks.map((check, i) => {
            const isOpen = openRows.has(i);
            return (
              <React.Fragment key={i}>
                <tr
                  onClick={() => toggle(i)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-3 py-3 text-gray-400">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 align-top">
                    {check.name}
                  </td>
                  <td className="px-4 py-3 text-center align-top">
                    <span
                      className={cn(
                        "inline-block px-2 py-0.5 rounded text-xs font-bold",
                        statusBadgeClass(check.status)
                      )}
                    >
                      {check.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 align-top">
                    {isOpen ? null : truncate(check.finding)}
                  </td>
                </tr>
                {isOpen && (
                  <tr className="bg-gray-50">
                    <td />
                    <td colSpan={3} className="px-4 pb-4 pt-2">
                      <FormattedFinding text={check.finding} />
                      {check.recommendation && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            Recommendation
                          </span>
                          <p className="mt-1 text-sm text-gray-600">{check.recommendation}</p>
                        </div>
                      )}
                      <ResourceLinks checkName={check.name} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Per-group mode ────────────────────────────────────────────────────────────

const GROUP_STYLES: Record<string, { header: string; badge: string }> = {
  FAIL: {
    header: "bg-red-50 border-red-200 text-red-800",
    badge: "bg-red-100 text-red-700",
  },
  WARN: {
    header: "bg-amber-50 border-amber-200 text-amber-800",
    badge: "bg-amber-100 text-amber-700",
  },
  PASS: {
    header: "bg-green-50 border-green-200 text-green-800",
    badge: "bg-green-100 text-green-700",
  },
};

function PerGroupTable({ checks }: { checks: Check[] }) {
  const groups = ["FAIL", "WARN", "PASS"].map((status) => ({
    status,
    items: checks.filter((c) => c.status === status),
  })).filter((g) => g.items.length > 0);

  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [openRows, setOpenRows] = useState<Set<string>>(new Set());

  function toggleGroup(status: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status); else next.add(status);
      return next;
    });
  }

  function toggleRow(key: string) {
    setOpenRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {groups.map(({ status, items }) => {
        const styles = GROUP_STYLES[status] ?? GROUP_STYLES.PASS;
        const isGroupOpen = openGroups.has(status);
        return (
          <div key={status} className={cn("rounded-lg border overflow-hidden", styles.header.split(" ").find(c => c.startsWith("border-")) ?? "border-gray-200")}>
            {/* Group header */}
            <button
              onClick={() => toggleGroup(status)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 font-semibold text-sm transition-colors",
                styles.header
              )}
            >
              <div className="flex items-center gap-2">
                {isGroupOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span>{status === "FAIL" ? "Failures" : status === "WARN" ? "Warnings" : "Passing"}</span>
                <span className={cn("px-1.5 py-0.5 rounded text-xs font-bold", styles.badge)}>
                  {items.length}
                </span>
              </div>
            </button>

            {/* Group rows */}
            {isGroupOpen && (
              <div className="divide-y divide-gray-100 bg-white">
                {items.map((check, i) => {
                  const rowKey = `${status}-${i}`;
                  const isOpen = openRows.has(rowKey);
                  return (
                    <div key={rowKey}>
                      <button
                        onClick={() => toggleRow(rowKey)}
                        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="mt-0.5 text-gray-400 shrink-0">
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </span>
                        <span className="font-medium text-gray-900 text-sm w-44 shrink-0">
                          {check.name}
                        </span>
                        <span className="text-gray-500 text-sm">
                          {isOpen ? null : truncate(check.finding)}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 ml-7 bg-gray-50">
                          <FormattedFinding text={check.finding} />
                          {check.recommendation && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                Recommendation
                              </span>
                              <p className="mt-1 text-sm text-gray-600">{check.recommendation}</p>
                            </div>
                          )}
                          <ResourceLinks checkName={check.name} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ChecksTable({ checks }: ChecksTableProps) {
  const [mode, setMode] = useState<GroupMode>("per-row");
  const [filter, setFilter] = useState<StatusFilter>("ALL");

  // Load saved mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as GroupMode | null;
    if (saved === "per-row" || saved === "per-group") setMode(saved);
  }, []);

  function switchMode(m: GroupMode) {
    setMode(m);
    localStorage.setItem(STORAGE_KEY, m);
  }

  if (!checks.length) return <p className="text-gray-400 text-sm">No checks available.</p>;

  const failCount = checks.filter((c) => c.status === "FAIL").length;
  const warnCount = checks.filter((c) => c.status === "WARN").length;
  const passCount = checks.filter((c) => c.status === "PASS").length;

  const sorted = [...checks].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3)
  );

  const filtered = filter === "ALL" ? sorted : sorted.filter((c) => c.status === filter);

  return (
    <div className="space-y-3">
      {/* Summary + controls bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Status filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilter("ALL")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
              filter === "ALL"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
            )}
          >
            All {checks.length}
          </button>
          {failCount > 0 && (
            <button
              onClick={() => setFilter(filter === "FAIL" ? "ALL" : "FAIL")}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
                filter === "FAIL"
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
              )}
            >
              ✕ {failCount} Fail
            </button>
          )}
          {warnCount > 0 && (
            <button
              onClick={() => setFilter(filter === "WARN" ? "ALL" : "WARN")}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
                filter === "WARN"
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
              )}
            >
              ⚠ {warnCount} Warn
            </button>
          )}
          {passCount > 0 && (
            <button
              onClick={() => setFilter(filter === "PASS" ? "ALL" : "PASS")}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
                filter === "PASS"
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
              )}
            >
              ✓ {passCount} Pass
            </button>
          )}
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => switchMode("per-row")}
            title="Per row"
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
              mode === "per-row"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Rows3 className="h-3.5 w-3.5" />
            Per Row
          </button>
          <button
            onClick={() => switchMode("per-group")}
            title="By group"
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
              mode === "per-group"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            By Group
          </button>
        </div>
      </div>

      {/* Table */}
      {mode === "per-row" ? (
        <PerRowTable checks={filtered} />
      ) : (
        <PerGroupTable checks={filtered} />
      )}
    </div>
  );
}
