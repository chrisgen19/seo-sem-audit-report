import { getOrgContext, isAdmin } from "@/lib/org";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

function orgTablesAvailable() {
  const d = db as unknown as { organizationMember?: unknown };
  const delegate = d.organizationMember as { findMany?: unknown; create?: unknown; findFirst?: unknown; count?: unknown } | undefined;
  return !!delegate?.findMany;
}

// Runtime-only reference; org tables may not exist in current schema (guarded by orgTablesAvailable())
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const om = (db as any).organizationMember;

/** GET /api/admin/members — list all org members */
export async function GET() {
  const ctx = await getOrgContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(ctx)) return Response.json({ error: "Admin only" }, { status: 403 });
  if (!orgTablesAvailable()) {
    return Response.json(
      { error: "Organization members feature is not available in this database schema." },
      { status: 501 }
    );
  }

  const members = await om.findMany({
    where: { organizationId: ctx.organizationId },
    include: {
      user: { select: { id: true, name: true, email: true, createdAt: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  return Response.json(members);
}

const createSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "MEMBER"]),
});

/** POST /api/admin/members — create a new user and add directly as ACTIVE member */
export async function POST(req: Request) {
  const ctx = await getOrgContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(ctx)) return Response.json({ error: "Admin only" }, { status: 403 });
  if (!orgTablesAvailable()) {
    return Response.json(
      { error: "Organization members feature is not available in this database schema." },
      { status: 501 }
    );
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, email, password, role } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return Response.json({ error: "Email already registered." }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);

  const member = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, email, passwordHash },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (tx as any).organizationMember.create({
      data: {
        userId: user.id,
        organizationId: ctx.organizationId,
        role,
        status: "ACTIVE",
      },
      include: {
        user: { select: { id: true, name: true, email: true, createdAt: true } },
      },
    });
  });

  return Response.json(member, { status: 201 });
}

const updateSchema = z.object({
  memberId: z.string().min(1),
  action: z.enum(["approve", "reject", "promote", "demote", "remove", "update"]),
  name: z.string().min(1).max(100).optional(),
  role: z.enum(["ADMIN", "MEMBER"]).optional(),
});

/** PATCH /api/admin/members — approve/reject/promote/demote/remove/update a member */
export async function PATCH(req: Request) {
  const ctx = await getOrgContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(ctx)) return Response.json({ error: "Admin only" }, { status: 403 });
  if (!orgTablesAvailable()) {
    return Response.json(
      { error: "Organization members feature is not available in this database schema." },
      { status: 501 }
    );
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { memberId, action, name, role } = parsed.data;

  const member = await om.findFirst({
    where: { id: memberId, organizationId: ctx.organizationId },
  });
  if (!member) return Response.json({ error: "Member not found" }, { status: 404 });

  // Prevent self-demotion/removal
  const selfDemotion =
    member.userId === ctx.userId &&
    (action === "demote" || action === "remove" || (action === "update" && role === "MEMBER"));
  if (selfDemotion) {
    return Response.json({ error: "Cannot demote or remove yourself." }, { status: 400 });
  }

  // Prevent removing the last admin
  const removingAdmin =
    member.role === "ADMIN" &&
    (action === "demote" || action === "remove" || (action === "update" && role === "MEMBER"));
  if (removingAdmin) {
    const adminCount = await om.count({
      where: { organizationId: ctx.organizationId, role: "ADMIN", status: "ACTIVE" },
    });
    if (adminCount <= 1) {
      return Response.json({ error: "Cannot remove the last admin." }, { status: 400 });
    }
  }

  switch (action) {
    case "approve":
      await om.update({ where: { id: memberId }, data: { status: "ACTIVE" } });
      break;

    case "reject":
    case "remove":
      await db.$transaction(async (tx) => {
        if (action === "reject" && member.status === "PENDING") {
          await tx.user.delete({ where: { id: member.userId } });
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (tx as any).organizationMember.delete({ where: { id: memberId } });
        }
      });
      break;

    case "promote":
      await om.update({ where: { id: memberId }, data: { role: "ADMIN" } });
      break;

    case "demote":
      await om.update({ where: { id: memberId }, data: { role: "MEMBER" } });
      break;

    case "update":
      await db.$transaction(async (tx) => {
        if (name !== undefined) {
          await tx.user.update({ where: { id: member.userId }, data: { name } });
        }
        if (role !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (tx as any).organizationMember.update({ where: { id: memberId }, data: { role } });
        }
      });
      break;
  }

  return Response.json({ success: true });
}
