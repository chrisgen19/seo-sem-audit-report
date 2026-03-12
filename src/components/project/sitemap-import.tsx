"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Map,
  Loader2,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Import,
} from "lucide-react";

interface SitemapEntry {
  url: string;
  name: string;
}

interface ScanResult {
  entries: SitemapEntry[];
  totalFound: number;
  alreadyImported: number;
}

interface SitemapImportProps {
  projectId: string;
  autoScan?: boolean;
}

export function SitemapImport({ projectId, autoScan = false }: SitemapImportProps) {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState(autoScan);
  const [filter, setFilter] = useState("");
  const [hasScanned, setHasScanned] = useState(false);

  async function handleScan() {
    setScanning(true);
    setError("");
    setResult(null);
    setSelected(new Set());

    const res = await fetch(`/api/projects/${projectId}/scan-sitemap`, {
      method: "POST",
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to scan sitemap.");
      setScanning(false);
      return;
    }

    const data = (await res.json()) as ScanResult;
    setResult(data);
    setHasScanned(true);
    setScanning(false);

    // Auto-select all if ≤10
    if (data.entries.length <= 10) {
      setSelected(new Set(data.entries.map((_, i) => i)));
    }
  }

  async function handleImport() {
    if (!result || selected.size === 0) return;
    setImporting(true);

    const pages = [...selected].map((i) => result.entries[i]);

    const res = await fetch(`/api/projects/${projectId}/import-pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pages }),
    });

    setImporting(false);

    if (res.ok) {
      const data = await res.json();
      // Remove imported entries from result
      const remaining = result.entries.filter((_, i) => !selected.has(i));
      setResult({
        ...result,
        entries: remaining,
        alreadyImported: result.alreadyImported + data.created,
      });
      setSelected(new Set());
      router.refresh();
    } else {
      setError("Failed to import pages.");
    }
  }

  function toggleAll(filtered: SitemapEntry[]) {
    const filteredIndices = filtered.map((e) => result!.entries.indexOf(e));
    const allSelected = filteredIndices.every((i) => selected.has(i));

    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filteredIndices.forEach((i) => next.delete(i));
        return next;
      });
    } else {
      setSelected((prev) => new Set([...prev, ...filteredIndices]));
    }
  }

  function toggleOne(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  const filtered = result
    ? result.entries.filter(
        (e) =>
          e.url.toLowerCase().includes(filter.toLowerCase()) ||
          e.name.toLowerCase().includes(filter.toLowerCase())
      )
    : [];

  const remainingCount = result?.entries.length ?? 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-brand-50 flex items-center justify-center">
            <Map className="h-4 w-4 text-brand-700" />
          </div>
          <div className="text-left">
            <h2 className="font-semibold text-gray-900 text-sm">
              Sitemap Import
            </h2>
            <p className="text-xs text-gray-400">
              Discover and import pages from sitemap.xml
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasScanned && remainingCount > 0 && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
              {remainingCount} available
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-6 py-4 space-y-4">
          {/* Scan button */}
          {!result && (
            <button
              onClick={handleScan}
              disabled={scanning}
              className="flex items-center gap-2 px-4 py-2 bg-brand-900 text-white rounded-lg hover:bg-brand-700 disabled:opacity-60 transition-colors text-sm font-medium"
            >
              {scanning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scanning sitemap...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Scan Sitemap
                </>
              )}
            </button>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <>
              {/* Stats */}
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">
                  <span className="font-medium text-gray-700">
                    {result.totalFound}
                  </span>{" "}
                  found in sitemap
                </span>
                {result.alreadyImported > 0 && (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {result.alreadyImported} already imported
                  </span>
                )}
                {result.entries.length > 0 && (
                  <span className="text-amber-600 font-medium">
                    {result.entries.length} available
                  </span>
                )}
              </div>

              {result.entries.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-400">
                  All sitemap pages have been imported.
                </div>
              ) : (
                <>
                  {/* Search + actions */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder="Filter pages..."
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <button
                      onClick={handleImport}
                      disabled={importing || selected.size === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-900 text-white rounded-lg hover:bg-brand-700 disabled:opacity-40 transition-colors text-sm font-medium shrink-0"
                    >
                      {importing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Import className="h-4 w-4" />
                          Import {selected.size > 0 ? `(${selected.size})` : ""}
                        </>
                      )}
                    </button>
                  </div>

                  {/* Page list */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Select all header */}
                    <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={
                          filtered.length > 0 &&
                          filtered.every((e) =>
                            selected.has(result.entries.indexOf(e))
                          )
                        }
                        onChange={() => toggleAll(filtered)}
                        className="rounded border-gray-300 text-brand-700 focus:ring-brand-500"
                      />
                      <span className="text-xs text-gray-500 font-medium">
                        {selected.size} of {result.entries.length} selected
                      </span>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                      {filtered.map((entry) => {
                        const idx = result.entries.indexOf(entry);
                        return (
                          <label
                            key={entry.url}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selected.has(idx)}
                              onChange={() => toggleOne(idx)}
                              className="rounded border-gray-300 text-brand-700 focus:ring-brand-500 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {entry.name}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {entry.url}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rescan */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={handleScan}
                      disabled={scanning}
                      className="text-xs text-gray-400 hover:text-brand-700 transition-colors flex items-center gap-1"
                    >
                      {scanning ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Search className="h-3 w-3" />
                      )}
                      Rescan sitemap
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
