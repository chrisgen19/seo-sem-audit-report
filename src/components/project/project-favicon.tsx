"use client";

import { Globe } from "lucide-react";
import { useState } from "react";

function getFaviconUrl(domain: string): string {
  try {
    const url = domain.startsWith("http") ? domain : `https://${domain}`;
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
  } catch {
    return "";
  }
}

interface ProjectFaviconProps {
  domain: string;
  className?: string;
  iconClassName?: string;
}

export function ProjectFavicon({ domain, className, iconClassName }: ProjectFaviconProps) {
  const [failed, setFailed] = useState(false);
  const url = getFaviconUrl(domain);

  if (!url || failed) {
    return (
      <div className={className ?? "h-10 w-10 rounded-lg bg-brand-100 flex items-center justify-center shrink-0"}>
        <Globe className={iconClassName ?? "h-5 w-5 text-brand-700"} />
      </div>
    );
  }

  return (
    <div className={className ?? "h-10 w-10 rounded-lg bg-brand-100 flex items-center justify-center shrink-0 overflow-hidden"}>
      <img
        src={url}
        alt=""
        className={iconClassName ?? "h-5 w-5 object-contain"}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
