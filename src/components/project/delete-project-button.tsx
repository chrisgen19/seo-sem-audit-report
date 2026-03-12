"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteProjectButtonProps {
  projectId: string;
  projectName: string;
}

export function DeleteProjectButton({ projectId, projectName }: DeleteProjectButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setConfirming(true);
  }

  function handleCancel(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setConfirming(false);
  }

  async function handleConfirm(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setPending(true);

    const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });

    if (res.ok) {
      router.refresh();
    } else {
      setPending(false);
      setConfirming(false);
      alert("Failed to delete project.");
    }
  }

  if (confirming) {
    return (
      <div
        className="flex items-center gap-1.5"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        <span className="text-xs text-gray-500 hidden sm:block">Delete project &amp; all data?</span>
        <button
          onClick={handleConfirm}
          disabled={pending}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          {pending ? "Deleting…" : "Confirm"}
        </button>
        <button
          onClick={handleCancel}
          className="px-2.5 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      title={`Delete "${projectName}"`}
      className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
