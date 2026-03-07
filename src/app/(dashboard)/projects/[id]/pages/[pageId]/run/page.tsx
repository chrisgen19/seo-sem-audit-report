"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { AuditProgress } from "@/components/audit/audit-progress";

interface ApiKeyStatus {
  claudeApiKey: string | null;
  geminiApiKey: string | null;
}

export default function RunAuditPage() {
  const { pageId } = useParams<{ id: string; pageId: string }>();
  const router = useRouter();

  const [provider, setProvider] = useState<"claude" | "gemini">("claude");
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d: ApiKeyStatus) => {
        setApiKeyStatus(d);
        if (!d.claudeApiKey && d.geminiApiKey) setProvider("gemini");
        setLoading(false);
      });
  }, []);

  const hasSelectedKey =
    provider === "claude" ? !!apiKeyStatus?.claudeApiKey : !!apiKeyStatus?.geminiApiKey;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-brand-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <Header title="Run Audit" subtitle="Choose your AI provider and start the analysis" />

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {!running ? (
          <div className="space-y-6">
            {/* Provider selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                AI Provider
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(["claude", "gemini"] as const).map((p) => {
                  const hasKey = p === "claude" ? !!apiKeyStatus?.claudeApiKey : !!apiKeyStatus?.geminiApiKey;
                  return (
                    <button
                      key={p}
                      onClick={() => setProvider(p)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        provider === p
                          ? "border-brand-700 bg-brand-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className="font-semibold text-gray-900">{p === "claude" ? "Claude" : "Gemini"}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {p === "claude" ? "Anthropic" : "Google AI"}
                      </p>
                      <p className={`text-xs mt-1 font-medium ${hasKey ? "text-green-600" : "text-red-500"}`}>
                        {hasKey ? "API key set" : "No key — set in Settings"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {!hasSelectedKey && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm">
                No API key for {provider === "claude" ? "Claude" : "Gemini"}.{" "}
                <a href="/settings" className="underline font-medium">
                  Go to Settings
                </a>{" "}
                to add one.
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => router.back()}
                className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => setRunning(true)}
                disabled={!hasSelectedKey}
                className="flex-1 py-2.5 px-4 bg-brand-900 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold"
              >
                Start Audit
              </button>
            </div>
          </div>
        ) : (
          <AuditProgress
            pageId={pageId}
            provider={provider}
            onCancel={() => setRunning(false)}
          />
        )}
      </div>
    </div>
  );
}
