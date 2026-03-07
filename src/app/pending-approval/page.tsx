"use client";

import { signOut } from "next-auth/react";
import { Clock, LogOut } from "lucide-react";

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 to-brand-700 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">SEO Audit</h1>
          <p className="text-brand-100 mt-1">AI-powered SEO &amp; SEM analysis</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <Clock className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Pending Approval
          </h2>
          <p className="text-gray-500 mb-6">
            Your account has been created but an administrator needs to approve
            your access before you can use the app. Please check back later.
          </p>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
