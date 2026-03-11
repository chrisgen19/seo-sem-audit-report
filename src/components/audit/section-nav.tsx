"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ExternalLink, Calendar, Cpu, FileText } from "lucide-react";

interface NavItem {
  id: string;
  label: string;
}

export interface AuditMetadata {
  url: string;
  pageTitle?: string | null;
  pageTitleLength?: number | null;
  metaDescription?: string | null;
  metaDescriptionLength?: number | null;
  date: string;
  provider: string;
  businessDesc?: string | null;
}

interface SectionNavProps {
  items: NavItem[];
  title: string;
  subtitle?: string;
  metadata?: AuditMetadata;
  actions?: React.ReactNode;
}

export function SectionNav({ items, title, subtitle, metadata, actions }: SectionNavProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0 }
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 100);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 130;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }

  return (
    <>
      <div
        className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 -mx-8 px-8 print:hidden transition-shadow"
        style={{ boxShadow: scrolled ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}
      >
        {/* Title row + actions */}
        <div className="flex items-center justify-between pt-3 pb-2 gap-4">
          <h1 className={cn(
            "font-bold text-gray-900 transition-all",
            scrolled ? "text-base" : "text-lg"
          )}>
            {title}
          </h1>
          {actions}
        </div>

        {/* Section nav pills */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                activeId === item.id
                  ? "bg-brand-900 text-white"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metadata / Subtitle — outside sticky, scrolls with page */}
      {metadata ? (
        <div className="mt-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <a
              href={metadata.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-brand-700 hover:text-brand-900 font-medium truncate max-w-full"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{metadata.url}</span>
            </a>
            <span className="inline-flex items-center gap-1 text-gray-400">
              <Calendar className="h-3.5 w-3.5" />
              {metadata.date}
            </span>
            <span className="inline-flex items-center gap-1 text-gray-500 capitalize">
              <Cpu className="h-3.5 w-3.5" />
              {metadata.provider}
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
              Page title {metadata.pageTitleLength != null && (
                <span className="font-normal normal-case text-gray-400">
                  ({metadata.pageTitleLength} chars — optimal 50–60)
                </span>
              )}
            </p>
            <p className="text-sm text-gray-700 line-clamp-2">
              {metadata.pageTitle || <span className="text-gray-400 italic">Not set</span>}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
              Meta description {metadata.metaDescriptionLength != null && (
                <span className="font-normal normal-case text-gray-400">
                  ({metadata.metaDescriptionLength} chars — optimal 120–160)
                </span>
              )}
            </p>
            <p className="text-sm text-gray-600 line-clamp-2">
              {metadata.metaDescription || <span className="text-gray-400 italic">Not set</span>}
            </p>
          </div>
          {metadata.businessDesc && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5 flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                Business
              </p>
              <p className="text-sm text-gray-600">{metadata.businessDesc}</p>
            </div>
          )}
        </div>
      ) : subtitle ? (
        <p className="text-gray-500 text-sm mt-4 mb-2">{subtitle}</p>
      ) : null}
    </>
  );
}
