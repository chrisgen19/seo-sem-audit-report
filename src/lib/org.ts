import { auth } from "./auth";
import { db } from "./db";
import type { OrgRole, MemberStatus } from "@prisma/client";

export interface OrgContext {
  userId: string;
  organizationId: string;
  role: OrgRole;
  status: MemberStatus;
}

/**
 * Gets the current user's active organization membership.
 * Returns null if the user is not authenticated or has no active membership.
 */
export async function getOrgContext(): Promise<OrgContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await db.organizationMember.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
    select: {
      organizationId: true,
      role: true,
      status: true,
    },
  });

  if (!membership) return null;

  return {
    userId: session.user.id,
    organizationId: membership.organizationId,
    role: membership.role,
    status: membership.status,
  };
}

/** Returns true if the user has ADMIN role in their org */
export function isAdmin(ctx: OrgContext): boolean {
  return ctx.role === "ADMIN";
}
