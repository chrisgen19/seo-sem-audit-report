"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
}

interface SectionNavProps {
  items: NavItem[];
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function SectionNav({ items, title, subtitle, actions }: SectionNavProps) {
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

      {/* Subtitle — outside sticky, scrolls with page */}
      {subtitle && (
        <p className="text-gray-500 text-sm mt-4 mb-2">{subtitle}</p>
      )}
    </>
  );
}
