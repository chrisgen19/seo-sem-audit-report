/**
 * Migration script: moves existing users & projects into an Organization.
 *
 * Run AFTER `pnpm db:push` with the new schema:
 *   npx tsx prisma/migrate-to-org.ts
 *
 * What it does:
 * 1. Creates a default organization if none exists
 * 2. Links all existing users as ACTIVE ADMIN members
 * 3. Re-links all projects that have no organizationId
 *
 * Safe to run multiple times (idempotent).
 */

import { PrismaClient } from "@prisma/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = new PrismaClient() as any;

async function main() {
  console.log("Starting org migration...\n");

  // 1. Create or find default organization
  let org = await db.organization.findFirst();
  if (!org) {
    org = await db.organization.create({
      data: { name: "My Organization", slug: "default" },
    });
    console.log(`Created organization: ${org.name} (${org.id})`);
  } else {
    console.log(`Using existing organization: ${org.name} (${org.id})`);
  }

  // 2. Create memberships for all users who don't have one
  const users = await db.user.findMany();
  let memberCount = 0;
  for (const user of users) {
    const existing = await db.organizationMember.findFirst({
      where: { userId: user.id, organizationId: org.id },
    });
    if (!existing) {
      await db.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          role: "ADMIN",
          status: "ACTIVE",
        },
      });
      memberCount++;
      console.log(`  Added ${user.email} as ADMIN`);
    }
  }
  console.log(`Created ${memberCount} new membership(s)`);

  // 3. Link all projects with null/empty organizationId to the org
  const result = await db.project.updateMany({
    where: {
      OR: [
        { organizationId: null },
        { organizationId: "" },
      ],
    },
    data: { organizationId: org.id },
  });

  if (result.count > 0) {
    console.log(`\nLinked ${result.count} project(s) to organization`);
  } else {
    console.log("\nAll projects already linked to an organization");
  }

  console.log("\nMigration complete!");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
