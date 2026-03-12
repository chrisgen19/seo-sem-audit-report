import { auth } from "@/lib/auth";
import { getCachedProject } from "@/lib/cache";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { ScoreBadge } from "@/components/audit/score-card";
import { formatDate } from "@/lib/utils";
import {
  Plus,
  ExternalLink,
  ChevronRight,
  FileText,
  BarChart3,
  Play,
  Clock,
} from "lucide-react";
import { DeletePageButton } from "@/components/delete-page-button";
import { SitemapImport } from "@/components/project/sitemap-import";

interface PageWithAudit {
  id: string;
  name: string;
  url: string;
  createdAt: Date;
  _count: { auditRuns: number };
  auditRuns: {
    id: string;
    overallScore: number | null;
    overallGrade: string | null;
    technicalScore: number | null;
    contentScore: number | null;
    semScore: number | null;
    createdAt: Date;
    status: string;
    meta?: { rawCrawlData: unknown } | null;
  }[];
}

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sitemap?: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const search = await searchParams;

  const project = await getCachedProject(id, session!.user.organizationId!);

  if (!project) notFound();

  const pages = project.pages as unknown as PageWithAudit[];
  const auditedPages = pages.filter((p) => p.auditRuns.length > 0);
  const unauditedPages = pages.filter((p) => p.auditRuns.length === 0);

  // Stats
  const totalPages = pages.length;
  const totalAudited = auditedPages.length;
  const scores = auditedPages
    .map((p) => p.auditRuns[0]?.overallScore)
    .filter((s): s is number => s !== null && s !== undefined);
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

  const autoScan = search.sitemap === "pending";

  return (
    <div>
      <Header
        title={project.name}
        subtitle={project.domain}
        actions={
          <Link
            href={`/projects/${project.id}/pages/new`}
            className="flex items-center gap-2 px-4 py-2 bg-brand-900 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Page
          </Link>
        }
      />

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Total Pages"
          value={totalPages.toString()}
          icon={<FileText className="h-4 w-4 text-brand-700" />}
        />
        <StatCard
          label="Audited"
          value={totalAudited.toString()}
          icon={<BarChart3 className="h-4 w-4 text-green-600" />}
          accent={totalAudited > 0 ? "green" : undefined}
        />
        <StatCard
          label="Unaudited"
          value={unauditedPages.length.toString()}
          icon={<Clock className="h-4 w-4 text-amber-600" />}
          accent={unauditedPages.length > 0 ? "amber" : undefined}
        />
        <StatCard
          label="Avg Score"
          value={avgScore !== null ? `${avgScore}` : "—"}
          icon={<BarChart3 className="h-4 w-4 text-brand-700" />}
        />
      </div>

      {/* Sitemap import */}
      <div className="mb-6">
        <SitemapImport projectId={project.id} autoScan={autoScan} />
      </div>

      {/* Audited pages */}
      {auditedPages.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-green-600" />
              <h2 className="font-semibold text-gray-900">Audited Pages</h2>
            </div>
            <span className="text-sm text-gray-400">
              {auditedPages.length}{" "}
              {auditedPages.length === 1 ? "page" : "pages"}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {auditedPages.map((page) => (
              <PageRow key={page.id} page={page} projectId={project.id} />
            ))}
          </div>
        </div>
      )}

      {/* Unaudited pages */}
      {unauditedPages.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <h2 className="font-semibold text-gray-900">Unaudited Pages</h2>
            </div>
            <span className="text-sm text-gray-400">
              {unauditedPages.length}{" "}
              {unauditedPages.length === 1 ? "page" : "pages"}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {unauditedPages.map((page) => (
              <div
                key={page.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
              >
                <Link
                  href={`/projects/${project.id}/pages/${page.id}`}
                  className="flex-1 min-w-0"
                >
                  <p className="font-medium text-gray-900 truncate">
                    {page.name}
                  </p>
                  <p className="text-sm text-gray-400 mt-0.5 truncate">
                    {page.url}
                  </p>
                </Link>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <Link
                    href={`/projects/${project.id}/pages/${page.id}/run`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-900 rounded-lg hover:bg-brand-100 transition-colors text-xs font-medium"
                  >
                    <Play className="h-3 w-3" />
                    Run Audit
                  </Link>
                  <Link
                    href={`/projects/${project.id}/pages/${page.id}`}
                    className="p-1"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-brand-500 transition-colors" />
                  </Link>
                  <DeletePageButton
                    projectId={project.id}
                    pageId={page.id}
                    pageName={page.name}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {pages.length === 0 && (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-10 text-center">
          <FileText className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">
            No pages yet. Add pages manually or scan the sitemap above.
          </p>
          <Link
            href={`/projects/${project.id}/pages/new`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-900 text-white rounded-lg hover:bg-brand-700 text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add first page
          </Link>
        </div>
      )}

      {/* Project meta */}
      <div className="mt-4 flex items-center gap-3">
        <a
          href={project.domain}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-brand-700 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          {project.domain}
        </a>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: "green" | "amber";
}) {
  const bg =
    accent === "green"
      ? "bg-green-50 border-green-100"
      : accent === "amber"
        ? "bg-amber-50 border-amber-100"
        : "bg-white border-gray-200";

  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function PageRow({
  page,
  projectId,
}: {
  page: PageWithAudit;
  projectId: string;
}) {
  const latest = page.auditRuns[0];

  return (
    <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
      <Link
        href={`/projects/${projectId}/pages/${page.id}`}
        className="flex-1 flex items-center justify-between min-w-0"
      >
        <div className="min-w-0">
          <p className="font-medium text-gray-900 truncate">{page.name}</p>
          <p className="text-sm text-gray-400 mt-0.5 truncate">{page.url}</p>
        </div>

        <div className="flex items-center gap-6 ml-4 shrink-0">
          {latest ? (
            <>
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-400">Last audit</p>
                <p className="text-sm text-gray-600">
                  {formatDate(latest.createdAt)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Score</p>
                {latest.overallScore !== null ? (
                  <ScoreBadge score={latest.overallScore!} />
                ) : (
                  <span className="text-xs text-gray-300">&mdash;</span>
                )}
              </div>
              <div className="grid grid-cols-5 gap-2 text-center hidden md:grid">
                {(() => {
                  const rawCrawl = latest.meta?.rawCrawlData as Record<
                    string,
                    unknown
                  > | null;
                  const psiMobile = (
                    rawCrawl?.psi as Record<string, unknown> | undefined
                  )?.performance_score as number | undefined;
                  const psiDesktop = (
                    rawCrawl?.psi_desktop as Record<string, unknown> | undefined
                  )?.performance_score as number | undefined;
                  return [
                    { label: "Tech", score: latest.technicalScore },
                    { label: "Content", score: latest.contentScore },
                    { label: "SEM", score: latest.semScore },
                    { label: "PSI M", score: psiMobile ?? null },
                    { label: "PSI D", score: psiDesktop ?? null },
                  ].map(({ label, score }) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400">{label}</p>
                      {score !== null ? (
                        <ScoreBadge score={score!} />
                      ) : (
                        <span className="text-xs text-gray-300">&mdash;</span>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </>
          ) : (
            <span className="text-sm text-gray-400">
              {page._count.auditRuns > 0 ? "No completed audits" : "Never audited"}
            </span>
          )}
          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-brand-500 transition-colors" />
        </div>
      </Link>
      <DeletePageButton
        projectId={projectId}
        pageId={page.id}
        pageName={page.name}
      />
    </div>
  );
}
