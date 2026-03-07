"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

interface DeletePageButtonProps {
  projectId: string;
  pageId: string;
  pageName: string;
}

export function DeletePageButton({ projectId, pageId, pageName }: DeletePageButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Delete page "${pageName}" and all its audit history?`)) return;

    setPending(true);
    const res = await fetch(`/api/projects/${projectId}/pages/${pageId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.refresh();
    } else {
      setPending(false);
      alert("Failed to delete page.");
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
      title="Delete page"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
