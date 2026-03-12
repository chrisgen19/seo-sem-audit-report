import { unstable_cache, revalidateTag } from "next/cache";
import { db } from "./db";

// ─── Dashboard ──────────────────────────────────────────────

export function getCachedDashboardData(orgId: string) {
  return unstable_cache(
    async () => {
      const [projects, recentAudits] = await Promise.all([
        db.project.findMany({
          where: { organizationId: orgId },
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
        }),
        db.auditRun.findMany({
          where: {
            status: "done",
            page: { project: { organizationId: orgId } },
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
        }),
      ]);

      return { projects, recentAudits };
    },
    [`dashboard-${orgId}`],
    { tags: ["dashboard"], revalidate: 60 }
  )();
}

// ─── Projects List ──────────────────────────────────────────

export function getCachedProjects(orgId: string) {
  return unstable_cache(
    async () => {
      return db.project.findMany({
        where: { organizationId: orgId },
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
    },
    [`projects-${orgId}`],
    { tags: ["projects"], revalidate: 60 }
  )();
}

// ─── Project Detail ─────────────────────────────────────────
// Not cached — this page must reflect audit results immediately
// (revalidateTag does not work inside ReadableStream).

export function getCachedProject(projectId: string, orgId: string) {
  return db.project.findFirst({
    where: { id: projectId, organizationId: orgId },
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
}

// ─── Page Detail ────────────────────────────────────────────
// Not cached — this page is loaded immediately after every audit run,
// so it must always reflect the latest data from the DB.

export function getCachedPage(pageId: string, projectId: string, orgId: string) {
  return db.page.findFirst({
    where: { id: pageId, projectId, project: { organizationId: orgId } },
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
}

// ─── Audit Result ───────────────────────────────────────────

export function getCachedAuditRun(auditId: string, orgId: string) {
  return unstable_cache(
    async () => {
      const auditRun = await db.auditRun.findFirst({
        where: { id: auditId, page: { project: { organizationId: orgId } } },
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
