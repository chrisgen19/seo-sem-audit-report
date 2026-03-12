"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AuditProgress } from "@/components/audit/audit-progress";
import {
  ChevronLeft,
  Settings2,
  FileText,
  TrendingUp,
  Key,
  Zap,
  ShieldCheck,
} from "lucide-react";

const AUDIT_SECTIONS = [
  {
    icon: Settings2,
    label: "Technical SEO",
    checks: 16,
    weight: "40%",
    description: "Crawlability, meta tags, structured data, Core Web Vitals",
    bg: "bg-blue-50",
    border: "border-blue-100",
    text: "text-blue-700",
    icon_color: "text-blue-500",
  },
  {
    icon: FileText,
    label: "Content SEO",
    checks: 14,
    weight: "35%",
    description: "Title tags, headings, body copy, keyword signals",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    text: "text-emerald-700",
    icon_color: "text-emerald-500",
  },
  {
    icon: TrendingUp,
    label: "SEM Readiness",
    checks: 11,
    weight: "25%",
    description: "Ad copy signals, CTAs, landing page conversion quality",
    bg: "bg-amber-50",
    border: "border-amber-100",
    text: "text-amber-700",
    icon_color: "text-amber-500",
  },
];

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

  // Loading skeleton
  if (hasKey === null) {
    return (
      <div>
        <div className="h-5 w-28 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="h-36 bg-gray-200 rounded-xl animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-gray-200 rounded-xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // No API key state
  if (!hasKey) {
    return (
      <div>
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-700 mb-6 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to project
        </Link>

        <div className="max-w-md bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-b border-amber-100 p-8 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center bg-amber-100 rounded-full mb-4">
              <Key className="h-7 w-7 text-amber-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">API Key Required</h1>
            <p className="text-sm text-gray-500">
              Add your Gemini API key to start running audits
            </p>
          </div>

          <div className="p-6 space-y-5">
            <div className="space-y-3">
              {[
                { step: "1", text: "Go to Google AI Studio", sub: "aistudio.google.com" },
                { step: "2", text: "Generate an API key", sub: 'Under "Get API key"' },
                { step: "3", text: "Paste it in Settings", sub: "Settings → API Keys" },
              ].map(({ step, text, sub }) => (
                <div key={step} className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-brand-50 text-brand-900 text-xs font-bold flex items-center justify-center mt-0.5 border border-brand-100">
                    {step}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{text}</p>
                    <p className="text-xs text-gray-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => router.back()}
                className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Go Back
              </button>
              <Link
                href="/settings"
                className="flex-1 py-2.5 px-4 bg-brand-900 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm text-center font-medium"
              >
                Open Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Running state
  return (
    <div>
      {/* Back nav */}
      <Link
        href={`/projects/${projectId}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-700 mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to project
      </Link>

      {/* Branded header */}
      <div className="bg-brand-900 rounded-xl px-6 py-5 mb-6 relative overflow-hidden">
        <div className="absolute -right-6 -top-6 h-36 w-36 rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute -right-2 -top-2 h-24 w-24 rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute right-14 top-7 h-2.5 w-2.5 rounded-full bg-white/20 pointer-events-none" />
        <div className="absolute right-7 bottom-5 h-2 w-2 rounded-full bg-white/15 pointer-events-none" />

        <div className="relative flex items-center gap-4">
          <div className="flex-shrink-0 h-11 w-11 rounded-xl bg-white/10 flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              <span className="text-white/60 text-xs font-medium uppercase tracking-wider">
                Audit in progress
              </span>
            </div>
            <h1 className="text-lg font-bold text-white">Running SEO/SEM Audit</h1>
            <p className="text-white/55 text-sm">41 checks · Powered by Gemini AI</p>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Terminal — 2/3 width */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* macOS-style window chrome */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
              </div>
              <span className="text-xs text-gray-400 font-mono ml-1">audit.log</span>
            </div>
            <AuditProgress
              pageId={pageId}
              provider="gemini"
              onCancel={() => router.back()}
            />
          </div>
        </div>

        {/* Sidebar — 1/3 width */}
        <div className="space-y-4">
          {/* Audit scope card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-4 w-4 text-brand-700" />
              <h2 className="text-sm font-semibold text-gray-900">Audit Scope</h2>
              <span className="ml-auto text-xs text-gray-400 tabular-nums">41 checks</span>
            </div>
            <div className="space-y-2.5">
              {AUDIT_SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <div
                    key={section.label}
                    className={`rounded-lg border p-3 ${section.bg} ${section.border}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`h-3.5 w-3.5 ${section.icon_color}`} />
                        <span className={`text-xs font-semibold ${section.text}`}>
                          {section.label}
                        </span>
                      </div>
                      <span className={`text-xs font-mono opacity-60 ${section.text}`}>
                        {section.weight}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{section.description}</p>
                    <p className="mt-1.5 text-xs text-gray-400">{section.checks} checks</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tip card */}
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 leading-relaxed">
              <span className="font-semibold text-gray-700">How it works:</span> Your page is
              crawled, analyzed with AI, then scored against a deterministic rubric for consistent
              results across audits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
