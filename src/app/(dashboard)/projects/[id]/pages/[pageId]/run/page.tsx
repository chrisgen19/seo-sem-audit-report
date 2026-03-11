"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { AuditProgress } from "@/components/audit/audit-progress";

export default function RunAuditPage() {
  const { id: projectId, pageId } = useParams<{ id: string; pageId: string }>();
  const router = useRouter();

  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d: { geminiApiKey: string | null }) => {
        setHasKey(!!d.geminiApiKey);
      });
  }, []);

  if (hasKey === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-brand-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!hasKey) {
    return (
      <div className="max-w-lg">
        <Header title="Run Audit" subtitle="Analyze your page with Gemini AI" />
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm">
            No API key for Gemini.{" "}
            <a href="/settings" className="underline font-medium">
              Go to Settings
            </a>{" "}
            to add one.
          </div>
          <button
            onClick={() => router.back()}
            className="w-full py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <Header title="Running Audit" subtitle="Analyzing your page with Gemini AI" />

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <AuditProgress
          pageId={pageId}
          projectId={projectId}
          provider="gemini"
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}
