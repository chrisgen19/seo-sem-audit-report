"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import type { AuditStreamEvent } from "@/types/audit";

interface AuditProgressProps {
  pageId: string;
  provider: "gemini";
  onCancel: () => void;
}

interface LogEntry {
  step: string;
  message: string;
  ts: number;
}

const DONE_STEPS = new Set(["crawl_done", "analyze_done", "done"]);
const ERROR_STEP = "error";

export function AuditProgress({ pageId, provider, onCancel }: AuditProgressProps) {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [isError, setIsError] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    // Prevent StrictMode double-mount from firing two requests.
    // The ref persists across remounts — only the first mount runs.
    if (startedRef.current) return;
    startedRef.current = true;

    const abortController = new AbortController();
    abortRef.current = abortController;

    async function run() {
      const res = await fetch("/api/audits/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, provider }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        if (abortController.signal.aborted) return;
        const err = await res.json();
        setLog((prev) => [
          ...prev,
          { step: ERROR_STEP, message: err.error ?? "Failed to start audit.", ts: Date.now() },
        ]);
        setIsError(true);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6)) as AuditStreamEvent;
            setLog((prev) => [...prev, { step: event.step, message: "message" in event ? event.message : "", ts: Date.now() }]);

            if (event.step === "done") {
              setIsDone(true);
              setTimeout(() => (window.location.href = `/audits/${event.auditId}`), 800);
              return;
            }
            if (event.step === "error") {
              setIsError(true);
              return;
            }
          } catch {
            /* ignore parse errors */
          }
        }
      }
    }

    run().catch((err) => {
      if (err?.name === "AbortError") return;
      setLog((prev) => [
        ...prev,
        { step: ERROR_STEP, message: err?.message ?? "Unexpected error.", ts: Date.now() },
      ]);
      setIsError(true);
    });

    // No cleanup abort — StrictMode unmount must not kill the stream.
    // Abort only happens via the Cancel button (handleCancel).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  function handleCancel() {
    abortRef.current?.abort();
    onCancel();
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 rounded-xl p-4 h-80 overflow-y-auto font-mono text-sm">
        {log.map((entry, i) => (
          <div key={i} className="flex items-start gap-2 py-0.5">
            {DONE_STEPS.has(entry.step) ? (
              <CheckCircle className="h-3.5 w-3.5 text-green-400 mt-0.5 shrink-0" />
            ) : entry.step === ERROR_STEP ? (
              <XCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
            ) : (
              <span className="text-slate-500 shrink-0">›</span>
            )}
            <span
              className={
                entry.step === ERROR_STEP
                  ? "text-red-400"
                  : DONE_STEPS.has(entry.step)
                  ? "text-green-400"
                  : "text-slate-300"
              }
            >
              {entry.message}
            </span>
          </div>
        ))}

        {!isDone && !isError && (
          <div className="flex items-center gap-2 py-0.5 text-slate-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            <span>Running...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {isDone && (
        <p className="text-center text-green-600 font-medium">
          Audit complete! Redirecting to audit history...
        </p>
      )}

      {isError && (
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Go back
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 py-2 px-4 bg-brand-900 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {!isDone && !isError && (
        <button
          onClick={handleCancel}
          className="w-full py-2 px-4 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 text-sm transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
