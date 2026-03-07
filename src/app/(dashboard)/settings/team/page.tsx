"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";
import {
  UserCheck,
  UserX,
  ShieldCheck,
  Shield,
  Trash2,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface Member {
  id: string;
  role: "ADMIN" | "MEMBER";
  status: "PENDING" | "ACTIVE";
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
  };
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    const res = await fetch("/api/admin/members");
    if (res.ok) {
      setMembers(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  async function handleAction(memberId: string, action: string) {
    const confirmMsg =
      action === "remove"
        ? "Remove this member from the organization?"
        : action === "reject"
          ? "Reject and delete this user?"
          : null;

    if (confirmMsg && !confirm(confirmMsg)) return;

    setActionLoading(memberId);
    const res = await fetch("/api/admin/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, action }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Action failed");
    }

    await fetchMembers();
    setActionLoading(null);
  }

  const pending = members.filter((m) => m.status === "PENDING");
  const active = members.filter((m) => m.status === "ACTIVE");

  return (
    <div>
      <Header
        title="Team Management"
        subtitle="Manage organization members and roles"
      />

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : (
        <div className="space-y-6">
          {/* Pending approvals */}
          {pending.length > 0 && (
            <div className="bg-white rounded-xl border border-amber-200">
              <div className="px-6 py-4 border-b border-amber-100 bg-amber-50 rounded-t-xl">
                <h2 className="font-semibold text-amber-800 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pending Approval ({pending.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-50">
                {pending.map((m) => (
                  <div
                    key={m.id}
                    className="px-6 py-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {m.user.name ?? m.user.email}
                      </p>
                      <p className="text-sm text-gray-400">{m.user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAction(m.id, "approve")}
                        disabled={actionLoading === m.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                      >
                        <UserCheck className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(m.id, "reject")}
                        disabled={actionLoading === m.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <UserX className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active members */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Active Members ({active.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {active.map((m) => (
                <div
                  key={m.id}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold",
                        m.role === "ADMIN"
                          ? "bg-brand-100 text-brand-900"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {(m.user.name ?? m.user.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {m.user.name ?? m.user.email}
                        {m.role === "ADMIN" && (
                          <span className="ml-2 text-xs font-semibold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded">
                            ADMIN
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-400">{m.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.role === "MEMBER" ? (
                      <button
                        onClick={() => handleAction(m.id, "promote")}
                        disabled={actionLoading === m.id}
                        title="Promote to Admin"
                        className="p-2 text-gray-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction(m.id, "demote")}
                        disabled={actionLoading === m.id}
                        title="Demote to Member"
                        className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Shield className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleAction(m.id, "remove")}
                      disabled={actionLoading === m.id}
                      title="Remove from organization"
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
