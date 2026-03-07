/**
 * Migration script: moves existing users & projects into an Organization.
 *
 * Run AFTER `pnpm db:push` with the new schema:
 *   npx tsx prisma/migrate-to-org.ts
 *
 * What it does:
 * 1. Creates a default organization if none exists
 * 2. Links all existing users as ACTIVE ADMIN members
 * 3. Re-links all projects from userId to organizationId
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Starting org migration...\n");

  // 1. Check if an org already exists
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
  console.log(`\nCreated ${memberCount} membership(s)`);

  // 3. Re-link projects that still have userId but no organizationId
  // The old schema had userId on Project — now it's organizationId.
  // After db:push, projects with the old userId column will have a null organizationId.
  const projects = await db.project.findMany({
    where: { organizationId: "" }, // empty string from migration
  });

  // If there are orphaned projects with empty organizationId, fix them
  if (projects.length > 0) {
    await db.project.updateMany({
      where: { organizationId: "" },
      data: { organizationId: org.id },
    });
    console.log(`\nRe-linked ${projects.length} project(s) to org`);
  }

  // Also try updating any with the org ID already set (no-op but safe)
  const allProjects = await db.project.findMany();
  let relinked = 0;
  for (const project of allProjects) {
    if (project.organizationId !== org.id) {
      await db.project.update({
        where: { id: project.id },
        data: { organizationId: org.id },
      });
      relinked++;
    }
  }
  if (relinked > 0) console.log(`Re-linked ${relinked} additional project(s)`);

  console.log("\nMigration complete!");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
