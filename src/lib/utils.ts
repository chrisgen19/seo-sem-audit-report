import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function gradeColor(grade: string): string {
  if (grade.startsWith("A")) return "text-green-600";
  if (grade.startsWith("B")) return "text-blue-600";
  if (grade === "C") return "text-yellow-600";
  return "text-red-600";
}

export function scoreBg(score: number): string {
  if (score >= 80) return "bg-green-100 text-green-800";
  if (score >= 60) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

export function statusBadgeClass(status: string): string {
  if (status === "PASS") return "bg-green-500 text-white";
  if (status === "WARN") return "bg-amber-500 text-white";
  return "bg-red-500 text-white";
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function normalizeUrl(url: string): string {
  if (!url.startsWith("http")) return `https://${url}`;
  return url;
}
