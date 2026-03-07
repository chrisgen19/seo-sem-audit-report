import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { ScoreBadge } from "@/components/audit/score-card";
import { formatDate } from "@/lib/utils";
import { Plus, ExternalLink, ChevronRight, FileText } from "lucide-react";
import { DeletePageButton } from "@/components/delete-page-button";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const project = await db.project.findFirst({
    where: { id, organizationId: session!.user.organizationId! },
    include: {
      pages: {
        orderBy: { createdAt: "asc" },
        include: {
          auditRuns: {
            where: { status: "done" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              overallScore: true,
              overallGrade: true,
              technicalScore: true,
              contentScore: true,
              semScore: true,
              createdAt: true,
              meta: { select: { rawCrawlData: true } },
            },
          },
          _count: { select: { auditRuns: true } },
        },
      },
    },
  });

  if (!project) notFound();

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

      {/* Pages list */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Pages</h2>
          <span className="text-sm text-gray-400">{project.pages.length} pages</span>
        </div>

        {project.pages.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 mb-4">No pages yet. Add the pages you want to audit.</p>
            <Link
              href={`/projects/${project.id}/pages/new`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-900 text-white rounded-lg hover:bg-brand-700 text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add first page
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {project.pages.map((page) => {
              const latest = page.auditRuns[0];
              return (
                <div
                  key={page.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
                >
                  <Link
                    href={`/projects/${project.id}/pages/${page.id}`}
                    className="flex-1 flex items-center justify-between min-w-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{page.name}</p>
                      <p className="text-sm text-gray-400 mt-0.5">{page.url}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      {latest ? (
                        <>
                          <div className="text-right hidden sm:block">
                            <p className="text-xs text-gray-400">Last audit</p>
                            <p className="text-sm text-gray-600">{formatDate(latest.createdAt)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-400 mb-1">Score</p>
                            {latest.overallScore !== null ? (
                              <ScoreBadge score={latest.overallScore!} />
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </div>
                          <div className="grid grid-cols-5 gap-2 text-center hidden md:grid">
                            {(() => {
                              const rawCrawl = latest.meta?.rawCrawlData as Record<string, unknown> | null;
                              const psiMobile = (rawCrawl?.psi as Record<string, unknown> | undefined)?.performance_score as number | undefined;
                              const psiDesktop = (rawCrawl?.psi_desktop as Record<string, unknown> | undefined)?.performance_score as number | undefined;
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
                                    <span className="text-xs text-gray-300">—</span>
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
                    projectId={project.id}
                    pageId={page.id}
                    pageName={page.name}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

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
