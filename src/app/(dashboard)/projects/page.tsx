import { auth } from "@/lib/auth";
import { getCachedProjects } from "@/lib/cache";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { ScoreBadge } from "@/components/audit/score-card";
import { formatDate } from "@/lib/utils";
import { Plus, Globe, ChevronRight, FileText } from "lucide-react";
import { ProjectFavicon } from "@/components/project/project-favicon";
import { DeleteProjectButton } from "@/components/project/delete-project-button";

export default async function ProjectsPage() {
  const session = await auth();

  const projects = await getCachedProjects(session!.user.organizationId!);

  return (
    <div>
      <Header
        title="Projects"
        subtitle={`${projects.length} ${projects.length === 1 ? "project" : "projects"}`}
        actions={
          <Link
            href="/projects/new"
            className="flex items-center gap-2 px-4 py-2 bg-brand-900 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        }
      />

      {projects.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <Globe className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No projects yet. Add your first site to get started.</p>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-900 text-white rounded-lg hover:bg-brand-700 text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add project
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => {
            const allRuns = project.pages.flatMap((pg) => pg.auditRuns);
            const latest = allRuns.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0];

            return (
              <div key={project.id} className="group flex items-center bg-white rounded-xl border border-gray-200 hover:border-brand-500 hover:shadow-sm transition-all">
                <Link
                  href={`/projects/${project.id}`}
                  className="flex-1 p-5 flex items-center justify-between gap-6 min-w-0"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <ProjectFavicon domain={project.domain} />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{project.name}</p>
                      <p className="text-sm text-gray-400 truncate">{project.domain}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <FileText className="h-4 w-4" />
                      {project._count.pages} {project._count.pages === 1 ? "page" : "pages"}
                    </div>

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
                            <span className="text-xs text-gray-400">—</span>
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
                      <span className="text-sm text-gray-400">No audits yet</span>
                    )}
                    <span className="flex items-center gap-0.5 text-brand-700 group-hover:text-brand-900 font-medium text-xs transition-colors whitespace-nowrap">
                        View <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                  </div>
                </Link>
                {session?.user.role === "ADMIN" && (
                  <div className="pr-3">
                    <DeleteProjectButton
                      projectId={project.id}
                      projectName={project.name}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
