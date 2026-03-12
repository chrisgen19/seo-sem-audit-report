"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Loader2, CheckCircle, Map } from "lucide-react";

interface SitemapEntry {
  url: string;
  name: string;
}

type ScanState =
  | { phase: "idle" }
  | { phase: "creating" }
  | { phase: "scanning" }
  | { phase: "importing"; count: number }
  | { phase: "selecting"; projectId: string }
  | { phase: "done"; projectId: string };

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [scanSitemap, setScanSitemap] = useState(false);
  const [error, setError] = useState("");
  const [state, setState] = useState<ScanState>({ phase: "idle" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Step 1: Create project
    setState({ phase: "creating" });

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, domain }),
    });

    const data = await res.json();

    if (!res.ok) {
      setState({ phase: "idle" });
      setError(
        data.error?.fieldErrors?.domain?.[0] ??
          data.error ??
          "Failed to create project."
      );
      return;
    }

    const projectId = data.id as string;

    if (!scanSitemap) {
      router.push(`/projects/${projectId}`);
      return;
    }

    // Step 2: Scan sitemap
    setState({ phase: "scanning" });

    const scanRes = await fetch(`/api/projects/${projectId}/scan-sitemap`, {
      method: "POST",
    });

    if (!scanRes.ok) {
      // Scan failed, still redirect to project (it was created)
      router.push(`/projects/${projectId}`);
      return;
    }

    const scanData = (await scanRes.json()) as {
      entries: SitemapEntry[];
      totalFound: number;
      alreadyImported: number;
    };

    if (scanData.entries.length === 0) {
      // No pages found or all already imported
      router.push(`/projects/${projectId}`);
      return;
    }

    // If ≤10 pages, auto-import all
    if (scanData.entries.length <= 10) {
      setState({ phase: "importing", count: scanData.entries.length });

      await fetch(`/api/projects/${projectId}/import-pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages: scanData.entries }),
      });

      setState({ phase: "done", projectId });
      router.push(`/projects/${projectId}`);
      return;
    }

    // >10 pages: redirect to project page where user can select
    setState({ phase: "selecting", projectId });
    router.push(`/projects/${projectId}?sitemap=pending`);
  }

  const isSubmitting = state.phase !== "idle";

  return (
    <div className="max-w-lg">
      <Header title="New Project" subtitle="Add a website domain to audit" />

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
              placeholder="e.g. Access Indigenous"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Domain
            </label>
            <input
              type="url"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
              placeholder="https://example.com"
            />
            <p className="text-xs text-gray-400 mt-1">
              The root domain — you&apos;ll add individual pages next.
            </p>
          </div>

          {/* Sitemap toggle */}
          <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={scanSitemap}
              onChange={(e) => setScanSitemap(e.target.checked)}
              disabled={isSubmitting}
              className="mt-0.5 rounded border-gray-300 text-brand-700 focus:ring-brand-500"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <Map className="h-3.5 w-3.5 text-brand-700" />
                <span className="text-sm font-medium text-gray-800">
                  Scan sitemap to auto-add pages
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Fetches sitemap.xml and discovers all pages. If more than 10 are
                found, you&apos;ll choose which ones to import.
              </p>
            </div>
          </label>

          {/* Progress indicator */}
          {isSubmitting && (
            <div className="p-3 bg-brand-50 border border-brand-100 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-brand-900">
                {state.phase === "done" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <span>
                  {state.phase === "creating" && "Creating project..."}
                  {state.phase === "scanning" && "Scanning sitemap..."}
                  {state.phase === "importing" &&
                    `Importing ${state.count} pages...`}
                  {state.phase === "selecting" && "Redirecting to select pages..."}
                  {state.phase === "done" && "Done! Redirecting..."}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 bg-brand-900 text-white rounded-lg hover:bg-brand-700 disabled:opacity-60 transition-colors text-sm font-semibold"
            >
              {isSubmitting ? "Working..." : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
