"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Eye, EyeOff } from "lucide-react";

interface SettingsData {
  name: string;
  email: string;
  geminiApiKey: string | null;
  geminiModel: string | null;
}

const GEMINI_MODELS = [
  "gemini-2.5-pro-preview-03-25",
  "gemini-2.5-flash-preview-04-17",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [name, setName] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [geminiModel, setGeminiModel] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showGemini, setShowGemini] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d: SettingsData) => {
        setSettings(d);
        setName(d.name ?? "");
        setGeminiModel(d.geminiModel ?? "");
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const body: Record<string, string | null | undefined> = {
      name,
      geminiModel,
    };
    if (geminiKey) body.geminiApiKey = geminiKey;
    if (newPassword) {
      body.newPassword = newPassword;
      body.currentPassword = currentPassword;
    }

    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to save.");
      return;
    }

    setMessage("Settings saved successfully.");
    setGeminiKey("");
    setCurrentPassword("");
    setNewPassword("");
    setSettings((prev) => (prev ? { ...prev, ...data, geminiModel } : prev));
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-brand-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <Header title="Settings" subtitle="Manage your account and API keys" />

      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={save} className="space-y-6">
        {/* Profile */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={settings.email}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 text-sm cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Gemini */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Google (Gemini)</h2>
          <p className="text-xs text-gray-400 mb-4">
            Keys are encrypted (AES-256) before storage. Leave blank to keep existing key.
          </p>
          <div className="space-y-4">
            <ApiKeyField
              label="API Key"
              placeholder={settings.geminiApiKey ? "••••••••••••• (already set)" : "AIzaSy..."}
              value={geminiKey}
              onChange={setGeminiKey}
              show={showGemini}
              onToggleShow={() => setShowGemini((v) => !v)}
              isSet={!!settings.geminiApiKey}
            />
            <ModelField
              label="Model"
              value={geminiModel}
              onChange={setGeminiModel}
              suggestions={GEMINI_MODELS}
              placeholder="gemini-2.5-pro-preview-03-25"
            />
          </div>
        </div>

        {/* Password */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Change Password</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                placeholder="Leave blank to keep current"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                placeholder="Min. 8 characters"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 px-4 bg-brand-900 text-white rounded-lg hover:bg-brand-700 disabled:opacity-60 transition-colors font-semibold text-sm"
        >
          {saving ? "Saving..." : "Save settings"}
        </button>
      </form>
    </div>
  );
}

interface ApiKeyFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  isSet: boolean;
}

function ApiKeyField({ label, placeholder, value, onChange, show, onToggleShow, isSet }: ApiKeyFieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {isSet && <span className="text-xs text-green-600 font-medium">Set</span>}
      </div>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-mono"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

interface ModelFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder: string;
}

function ModelField({ label, value, onChange, suggestions, placeholder }: ModelFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        list={`model-suggestions-${placeholder}`}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-mono"
        placeholder={placeholder}
      />
      <datalist id={`model-suggestions-${placeholder}`}>
        {suggestions.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>
      <p className="text-xs text-gray-400 mt-1">
        Type any model ID or pick from the dropdown. Leave blank to use the default.
      </p>
    </div>
  );
}
