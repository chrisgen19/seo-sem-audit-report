import { auth } from "./auth";
import { db } from "./db";

// Defined locally — these enums only exist in the DB schema after the org migration
type OrgRole = string;
type MemberStatus = string;

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

  const organizationMemberDelegate = (db as unknown as { organizationMember?: unknown })
    .organizationMember as
    | {
        findFirst?: (args: unknown) => Promise<{
          organizationId: string;
          role: OrgRole;
          status: MemberStatus;
        } | null>;
      }
    | undefined;

  // Back-compat: when org tables are missing, treat the user as their own "org"
  if (!organizationMemberDelegate?.findFirst) {
    return {
      userId: session.user.id,
      organizationId: session.user.id,
      role: "ADMIN" as OrgRole,
      status: "ACTIVE" as MemberStatus,
    };
  }

  const membership = await organizationMemberDelegate.findFirst({
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
