"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Trash2 } from "lucide-react";
import { ScoreBadge } from "@/components/audit/score-card";
import { formatDateTime } from "@/lib/utils";

export type AuditRunRow = {
  id: string;
  status: string;
  provider: string;
  overallScore: number | null;
  technicalScore: number | null;
  contentScore: number | null;
  semScore: number | null;
  createdAt: string;
  errorMessage: string | null;
  psiMobile: number | null;
  psiDesktop: number | null;
};

type SortKey = "date-desc" | "date-asc" | "score-desc" | "score-asc";
type StatusFilter = "all" | "done" | "failed" | "pending";
type ProviderFilter = "all" | "gemini";

interface Props {
  runs: AuditRunRow[];
  projectId?: string;
  pageId?: string;
}

export function AuditHistoryTable({ runs }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("all");
  const [sort, setSort] = useState<SortKey>("date-desc");
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const filtered = useMemo(() => {
    let result = [...runs];
    if (statusFilter !== "all") result = result.filter((r) => r.status === statusFilter);
    if (providerFilter !== "all") result = result.filter((r) => r.provider === providerFilter);
    result.sort((a, b) => {
      if (sort === "date-desc") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === "date-asc") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sort === "score-desc") return (b.overallScore ?? -1) - (a.overallScore ?? -1);
      if (sort === "score-asc") return (a.overallScore ?? 101) - (b.overallScore ?? 101);
      return 0;
    });
    return result;
  }, [runs, statusFilter, providerFilter, sort]);

  const allFilteredIds = filtered.map((r) => r.id);
  const allSelected =
    allFilteredIds.length > 0 && allFilteredIds.every((id) => selected.has(id));
  const someSelected = allFilteredIds.some((id) => selected.has(id)) && !allSelected;

  function toggleAll() {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => new Set([...prev, ...allFilteredIds]));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    setBulkDeleting(true);
    await fetch("/api/audits/bulk-delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected] }),
    });
    setSelected(new Set());
    setBulkDeleting(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/audits/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const selectedCount = [...selected].filter((id) => runs.some((r) => r.id === id)).length;

  return (
    <div>
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="all">All statuses</option>
          <option value="done">Done</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>

        <select
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value as ProviderFilter)}
          className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="all">All providers</option>
          <option value="gemini">Gemini</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="score-desc">Score: high → low</option>
          <option value="score-asc">Score: low → high</option>
        </select>

        <span className="text-xs text-gray-400 ml-1">
          {filtered.length} {filtered.length === 1 ? "run" : "runs"}
        </span>

        {selectedCount > 0 && (
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {bulkDeleting ? "Deleting…" : `Delete ${selectedCount} selected`}
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="p-10 text-center text-sm text-gray-400">
          No audit runs match the current filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="pl-4 pr-2 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-brand-700 focus:ring-brand-500 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Date
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Provider
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Overall
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Tech
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Content
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  SEM
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                  PSI M
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                  PSI D
                </th>
                <th className="px-3 py-3 pr-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((run) => (
                <tr
                  key={run.id}
                  className={`transition-colors ${
                    selected.has(run.id) ? "bg-brand-50" : "hover:bg-gray-50"
                  }`}
                >
                  <td className="pl-4 pr-2 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(run.id)}
                      onChange={() => toggleOne(run.id)}
                      className="rounded border-gray-300 text-brand-700 focus:ring-brand-500 cursor-pointer"
                    />
                  </td>

                  <td className="px-3 py-3 whitespace-nowrap">
                    <p className="font-medium text-gray-900">{formatDateTime(run.createdAt)}</p>
                    {run.status !== "done" && (
                      <p
                        className={`text-xs mt-0.5 ${
                          run.status === "failed" ? "text-red-500" : "text-amber-600 capitalize"
                        }`}
                      >
                        {run.status === "failed" && run.errorMessage
                          ? run.errorMessage.slice(0, 50)
                          : run.status}
                      </p>
                    )}
                  </td>

                  <td className="px-3 py-3">
                    <span className="capitalize text-gray-600">{run.provider}</span>
                  </td>

                  {run.status === "done" ? (
                    <>
                      <ScoreCell score={run.overallScore} />
                      <ScoreCell score={run.technicalScore} />
                      <ScoreCell score={run.contentScore} />
                      <ScoreCell score={run.semScore} />
                      <ScoreCell score={run.psiMobile} className="hidden md:table-cell" />
                      <ScoreCell score={run.psiDesktop} className="hidden md:table-cell" />
                    </>
                  ) : (
                    <td colSpan={6} className="px-3 py-3 text-gray-300 text-xs">
                      —
                    </td>
                  )}

                  <td className="px-3 py-3 pr-4">
                    <div className="flex items-center justify-end gap-2">
                      {run.status === "done" && (
                        <Link
                          href={`/audits/${run.id}`}
                          className="flex items-center gap-0.5 text-brand-700 hover:text-brand-900 font-medium text-xs transition-colors whitespace-nowrap"
                        >
                          View <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                      <InlineDeleteButton onDelete={() => handleDelete(run.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ScoreCell({ score, className = "" }: { score: number | null; className?: string }) {
  return (
    <td className={`px-3 py-3 text-center ${className}`}>
      {score !== null ? (
        <ScoreBadge score={score} />
      ) : (
        <span className="text-gray-300 text-xs">—</span>
      )}
    </td>
  );
}

function InlineDeleteButton({ onDelete }: { onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={onDelete}
          className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Confirm
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs px-2 py-1 border border-gray-300 text-gray-600 rounded hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
      title="Delete audit"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
