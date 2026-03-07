"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";
import {
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  Plus,
  X,
  Pencil,
  Trash2,
  Save,
} from "lucide-react";

type Role = "ADMIN" | "MEMBER";

interface Member {
  id: string;
  role: Role;
  status: "PENDING" | "ACTIVE";
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
  };
}

const ROLE_LABELS: Record<Role, string> = { ADMIN: "Admin", MEMBER: "Member" };

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", password: "", role: "MEMBER" as Role });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<{ name: string; role: Role }>({ name: "", role: "MEMBER" });

  // Inline delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    const res = await fetch("/api/admin/members");
    if (res.ok) setMembers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  async function handleAction(memberId: string, action: string) {
    setActionLoading(memberId);
    setError(null);
    const res = await fetch("/api/admin/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, action }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Action failed");
    }
    await fetchMembers();
    setActionLoading(null);
    setDeletingId(null);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);
    const res = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    if (!res.ok) {
      const data = await res.json();
      setAddError(data.error ?? "Failed to add member");
    } else {
      setShowAddForm(false);
      setAddForm({ name: "", email: "", password: "", role: "MEMBER" });
      await fetchMembers();
    }
    setAddLoading(false);
  }

  async function handleUpdate(memberId: string) {
    setActionLoading(memberId);
    setError(null);
    const res = await fetch("/api/admin/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, action: "update", ...editState }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to update member");
    } else {
      setEditingId(null);
    }
    await fetchMembers();
    setActionLoading(null);
  }

  function startEdit(m: Member) {
    setEditingId(m.id);
    setEditState({ name: m.user.name ?? "", role: m.role });
    setDeletingId(null);
    setError(null);
  }

  const pending = members.filter((m) => m.status === "PENDING");
  const active = members.filter((m) => m.status === "ACTIVE");

  return (
    <div>
      <Header
        title="Team Management"
        subtitle="Manage organization members and roles"
        actions={
          <button
            onClick={() => { setShowAddForm((v) => !v); setAddError(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-900 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
          >
            {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showAddForm ? "Cancel" : "Add Member"}
          </button>
        }
      />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Add Member Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-brand-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Add New Member</h2>
          <form onSubmit={handleAdd} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input
                type="text"
                required
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                required
                value={addForm.email}
                onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="jane@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temporary password</label>
              <input
                type="text"
                required
                minLength={8}
                value={addForm.password}
                onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Min. 8 characters"
              />
              <p className="text-xs text-gray-400 mt-1">Share this with the member — they can change it in Settings.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={addForm.role}
                onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value as Role }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {addError && (
              <div className="sm:col-span-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {addError}
              </div>
            )}

            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={addLoading}
                className="px-4 py-2 bg-brand-900 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors"
              >
                {addLoading ? "Adding…" : "Add Member"}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setAddError(null); }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
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
                  <div key={m.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{m.user.name ?? m.user.email}</p>
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

            {active.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-gray-400">No active members yet.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {active.map((m) => {
                  const isEditing = editingId === m.id;
                  const isDeleting = deletingId === m.id;
                  const isLoading = actionLoading === m.id;

                  if (isEditing) {
                    return (
                      <div key={m.id} className="px-6 py-4 bg-brand-50 border-l-4 border-brand-700">
                        <div className="flex flex-wrap items-end gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                            <input
                              type="text"
                              value={editState.name}
                              onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
                              className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-44"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                            <p className="px-2.5 py-1.5 text-sm text-gray-400">{m.user.email}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                            <select
                              value={editState.role}
                              onChange={(e) => setEditState((s) => ({ ...s, role: e.target.value as Role }))}
                              className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                            >
                              <option value="MEMBER">Member</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdate(m.id)}
                              disabled={isLoading}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-900 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-60 transition-colors"
                            >
                              <Save className="h-3.5 w-3.5" />
                              {isLoading ? "Saving…" : "Save"}
                            </button>
                            <button
                              onClick={() => { setEditingId(null); setError(null); }}
                              className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m.id}
                      className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                            m.role === "ADMIN" ? "bg-brand-100 text-brand-900" : "bg-gray-100 text-gray-600"
                          )}
                        >
                          {(m.user.name ?? m.user.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {m.user.name ?? m.user.email}
                            <span
                              className={cn(
                                "ml-2 text-xs font-semibold px-1.5 py-0.5 rounded",
                                m.role === "ADMIN"
                                  ? "text-brand-700 bg-brand-50"
                                  : "text-gray-500 bg-gray-100"
                              )}
                            >
                              {ROLE_LABELS[m.role]}
                            </span>
                          </p>
                          <p className="text-sm text-gray-400">{m.user.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isDeleting ? (
                          <>
                            <span className="text-xs text-gray-500 mr-1">Remove this member?</span>
                            <button
                              onClick={() => handleAction(m.id, "remove")}
                              disabled={isLoading}
                              className="px-2.5 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
                            >
                              {isLoading ? "Removing…" : "Confirm"}
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="px-2.5 py-1.5 border border-gray-300 text-gray-600 text-xs rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(m)}
                              className="p-2 text-gray-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
                              title="Edit member"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => { setDeletingId(m.id); setEditingId(null); setError(null); }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove member"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
