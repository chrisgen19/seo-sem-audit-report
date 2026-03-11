import { unstable_cache, revalidateTag } from "next/cache";
import { db } from "./db";
import type { Prisma } from "@prisma/client";

function isUnknownArgumentError(err: unknown, argName: string) {
  if (!err || typeof err !== "object") return false;
  const message = "message" in err ? (err as { message?: unknown }).message : undefined;
  return typeof message === "string" && message.includes(`Unknown argument \`${argName}\``);
}

// ─── Payload types (collapse union from .catch() back-compat fallback) ──────

type DashboardProject = Prisma.ProjectGetPayload<{
  select: {
    _count: { select: { pages: true } };
    pages: { select: { auditRuns: { select: { overallScore: true } } } };
  };
}>;

type DashboardAuditRun = Prisma.AuditRunGetPayload<{
  select: {
    id: true; overallScore: true; technicalScore: true; contentScore: true;
    semScore: true; createdAt: true; provider: true;
    page: { select: { id: true; name: true; project: { select: { id: true; name: true } } } };
  };
}>;

type ProjectWithPages = Prisma.ProjectGetPayload<{
  include: {
    _count: { select: { pages: true } };
    pages: {
      include: {
        auditRuns: {
          select: {
            id: true; overallScore: true; overallGrade: true; technicalScore: true;
            contentScore: true; semScore: true; createdAt: true;
            meta: { select: { rawCrawlData: true } };
          };
        };
      };
    };
  };
}>;

type ProjectDetail = Prisma.ProjectGetPayload<{
  include: {
    pages: {
      include: {
        auditRuns: {
          select: {
            id: true; overallScore: true; overallGrade: true; technicalScore: true;
            contentScore: true; semScore: true; createdAt: true;
            meta: { select: { rawCrawlData: true } };
          };
        };
        _count: { select: { auditRuns: true } };
      };
    };
  };
}> | null;

type PageDetail = Prisma.PageGetPayload<{
  include: {
    project: { select: { id: true; name: true } };
    auditRuns: {
      select: {
        id: true; status: true; provider: true; overallScore: true; overallGrade: true;
        technicalScore: true; technicalGrade: true; contentScore: true; contentGrade: true;
        semScore: true; semGrade: true; createdAt: true; completedAt: true; errorMessage: true;
        meta: { select: { rawCrawlData: true } };
      };
    };
  };
}> | null;

// ─── Dashboard ──────────────────────────────────────────────

export function getCachedDashboardData(params: { orgId: string | null; userId: string }) {
  const { orgId, userId } = params;
  return unstable_cache(
    async () => {
      const projectsPromise = db.project
        .findMany({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          where: { organizationId: orgId } as any,
          select: {
            _count: { select: { pages: true } },
            pages: {
              select: {
                auditRuns: {
                  where: { status: "done" },
                  orderBy: { createdAt: "desc" },
                  take: 1,
                  select: { overallScore: true },
                },
              },
            },
          },
        })
        .catch((err) => {
          if (!isUnknownArgumentError(err, "organizationId")) throw err;
          return db.project.findMany({
            where: { userId },
            select: {
              _count: { select: { pages: true } },
              pages: {
                select: {
                  auditRuns: {
                    where: { status: "done" },
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    select: { overallScore: true },
                  },
                },
              },
            },
          });
        });

      const recentAuditsPromise = db.auditRun
        .findMany({
          where: {
            status: "done",
            page: { project: { organizationId: orgId } },
          } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            overallScore: true,
            technicalScore: true,
            contentScore: true,
            semScore: true,
            createdAt: true,
            provider: true,
            page: {
              select: {
                id: true,
                name: true,
                project: { select: { id: true, name: true } },
              },
            },
          },
        })
        .catch((err) => {
          if (!isUnknownArgumentError(err, "organizationId")) throw err;
          return db.auditRun.findMany({
            where: {
              status: "done",
              page: { project: { userId } },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true,
              overallScore: true,
              technicalScore: true,
              contentScore: true,
              semScore: true,
              createdAt: true,
              provider: true,
              page: {
                select: {
                  id: true,
                  name: true,
                  project: { select: { id: true, name: true } },
                },
              },
            },
          });
        });

      const [projects, recentAudits] = await Promise.all([projectsPromise, recentAuditsPromise]) as [DashboardProject[], DashboardAuditRun[]];

      return { projects, recentAudits };
    },
    [`dashboard-${orgId ?? "no-org"}-${userId}`],
    { tags: ["dashboard"], revalidate: 60 }
  )();
}

// ─── Projects List ──────────────────────────────────────────

export function getCachedProjects(orgId: string) {
  return unstable_cache(
    async () => {
      return (db.project
        .findMany({
          where: { organizationId: orgId } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          orderBy: { updatedAt: "desc" },
          include: {
            _count: { select: { pages: true } },
            pages: {
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
              },
            },
          },
        })
        .catch((err) => {
          if (!isUnknownArgumentError(err, "organizationId")) throw err;
          // Back-compat: older schema scopes projects by userId
          return db.project.findMany({
            where: { userId: orgId },
            orderBy: { updatedAt: "desc" },
            include: {
              _count: { select: { pages: true } },
              pages: {
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
                },
              },
            },
          });
        })) as Promise<ProjectWithPages[]>;
    },
    [`projects-${orgId}`],
    { tags: ["projects"], revalidate: 60 }
  )();
}

// ─── Project Detail ─────────────────────────────────────────

export function getCachedProject(projectId: string, orgId: string) {
  return unstable_cache(
    async () => {
      return (db.project
        .findFirst({
          where: { id: projectId, organizationId: orgId } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
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
        })
        .catch((err) => {
          if (!isUnknownArgumentError(err, "organizationId")) throw err;
          return db.project.findFirst({
            where: { id: projectId, userId: orgId },
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
        })) as Promise<ProjectDetail>;
    },
    [`project-${projectId}`],
    { tags: [`project-${projectId}`, "projects"], revalidate: 60 }
  )();
}

// ─── Page Detail ────────────────────────────────────────────

export function getCachedPage(pageId: string, projectId: string, orgId: string) {
  return unstable_cache(
    async () => {
      return (db.page
        .findFirst({
          where: { id: pageId, projectId, project: { organizationId: orgId } } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          include: {
            project: { select: { id: true, name: true } },
            auditRuns: {
              orderBy: { createdAt: "asc" },
              select: {
                id: true,
                status: true,
                provider: true,
                overallScore: true,
                overallGrade: true,
                technicalScore: true,
                technicalGrade: true,
                contentScore: true,
                contentGrade: true,
                semScore: true,
                semGrade: true,
                createdAt: true,
                completedAt: true,
                errorMessage: true,
                meta: { select: { rawCrawlData: true } },
              },
            },
          },
        })
        .catch((err) => {
          if (!isUnknownArgumentError(err, "organizationId")) throw err;
          return db.page.findFirst({
            where: { id: pageId, projectId, project: { userId: orgId } },
            include: {
              project: { select: { id: true, name: true } },
              auditRuns: {
                orderBy: { createdAt: "asc" },
                select: {
                  id: true,
                  status: true,
                  provider: true,
                  overallScore: true,
                  overallGrade: true,
                  technicalScore: true,
                  technicalGrade: true,
                  contentScore: true,
                  contentGrade: true,
                  semScore: true,
                  semGrade: true,
                  createdAt: true,
                  completedAt: true,
                  errorMessage: true,
                  meta: { select: { rawCrawlData: true } },
                },
              },
            },
          });
        })) as Promise<PageDetail>;
    },
    [`page-${pageId}`],
    { tags: [`page-${pageId}`, `project-${projectId}`], revalidate: 60 }
  )();
}

// ─── Audit Result ───────────────────────────────────────────

// Explicit payload type — avoids union type ambiguity from the .catch() back-compat fallback
type AuditRunResult = Prisma.AuditRunGetPayload<{
  include: {
    page: { select: { id: true; name: true; project: { select: { id: true; name: true } } } };
    checks: true;
    meta: true;
  };
}> | null;

export function getCachedAuditRun(auditId: string, orgId: string) {
  return unstable_cache(
    async () => {
      const auditRun = (await db.auditRun
        .findFirst({
          where: { id: auditId, page: { project: { organizationId: orgId } } } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          include: {
            page: {
              select: {
                id: true,
                name: true,
                project: { select: { id: true, name: true } },
              },
            },
            checks: { orderBy: [{ section: "asc" }, { name: "asc" }] },
            meta: true,
          },
        })
        .catch((err) => {
          if (!isUnknownArgumentError(err, "organizationId")) throw err;
          return db.auditRun.findFirst({
            where: { id: auditId, page: { project: { userId: orgId } } },
            include: {
              page: {
                select: {
                  id: true,
                  name: true,
                  project: { select: { id: true, name: true } },
                },
              },
              checks: { orderBy: [{ section: "asc" }, { name: "asc" }] },
              meta: true,
            },
          });
        })) as AuditRunResult;

      if (!auditRun) return null;

      // Get previous run for delta comparison
      const prevRun = await db.auditRun.findFirst({
        where: {
          pageId: auditRun.pageId,
          status: "done",
          createdAt: { lt: auditRun.createdAt },
        },
        orderBy: { createdAt: "desc" },
        select: {
          overallScore: true,
          technicalScore: true,
          contentScore: true,
          semScore: true,
          meta: { select: { rawCrawlData: true } },
        },
      });

      // Fetch all done runs for score trend chart
      const allDoneRuns = await db.auditRun.findMany({
        where: { pageId: auditRun.pageId, status: "done" },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          createdAt: true,
          overallScore: true,
          technicalScore: true,
          contentScore: true,
          semScore: true,
          meta: { select: { rawCrawlData: true } },
        },
      });

      return { auditRun, prevRun, allDoneRuns };
    },
    [`audit-${auditId}`],
    { tags: [`audit-${auditId}`], revalidate: 60 }
  )();
}

// ─── Revalidation helpers ───────────────────────────────────

export function revalidateDashboard() {
  revalidateTag("dashboard");
}

export function revalidateProjects() {
  revalidateTag("projects");
  revalidateTag("dashboard");
}

export function revalidateProject(projectId: string) {
  revalidateTag(`project-${projectId}`);
  revalidateTag("projects");
  revalidateTag("dashboard");
}

export function revalidatePage(pageId: string, projectId: string) {
  revalidateTag(`page-${pageId}`);
  revalidateTag(`project-${projectId}`);
  revalidateTag("projects");
  revalidateTag("dashboard");
}

export function revalidateAudit(auditId: string, pageId: string, projectId: string) {
  revalidateTag(`audit-${auditId}`);
  revalidateTag(`page-${pageId}`);
  revalidateTag(`project-${projectId}`);
  revalidateTag("projects");
  revalidateTag("dashboard");
}
