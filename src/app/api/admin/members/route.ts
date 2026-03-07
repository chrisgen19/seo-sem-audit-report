import { getOrgContext, isAdmin } from "@/lib/org";
import { db } from "@/lib/db";
import { z } from "zod";

/** GET /api/admin/members — list all org members */
export async function GET() {
  const ctx = await getOrgContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(ctx)) return Response.json({ error: "Admin only" }, { status: 403 });

  const members = await db.organizationMember.findMany({
    where: { organizationId: ctx.organizationId },
    include: {
      user: { select: { id: true, name: true, email: true, createdAt: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  return Response.json(members);
}

const updateSchema = z.object({
  memberId: z.string().min(1),
  action: z.enum(["approve", "reject", "promote", "demote", "remove"]),
});

/** PATCH /api/admin/members — approve/reject/promote/demote/remove a member */
export async function PATCH(req: Request) {
  const ctx = await getOrgContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(ctx)) return Response.json({ error: "Admin only" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { memberId, action } = parsed.data;

  const member = await db.organizationMember.findFirst({
    where: { id: memberId, organizationId: ctx.organizationId },
  });
  if (!member) return Response.json({ error: "Member not found" }, { status: 404 });

  // Prevent self-demotion/removal
  if (member.userId === ctx.userId && (action === "demote" || action === "remove")) {
    return Response.json({ error: "Cannot demote or remove yourself." }, { status: 400 });
  }

  switch (action) {
    case "approve":
      await db.organizationMember.update({
        where: { id: memberId },
        data: { status: "ACTIVE" },
      });
      break;

    case "reject":
    case "remove":
      await db.organizationMember.delete({ where: { id: memberId } });
      // Also delete the user account if rejecting a pending member
      if (action === "reject" && member.status === "PENDING") {
        await db.user.delete({ where: { id: member.userId } }).catch(() => {});
      }
      break;

    case "promote":
      await db.organizationMember.update({
        where: { id: memberId },
        data: { role: "ADMIN" },
      });
      break;

    case "demote":
      await db.organizationMember.update({
        where: { id: memberId },
        data: { role: "MEMBER" },
      });
      break;
  }

  return Response.json({ success: true });
}
