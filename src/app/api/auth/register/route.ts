import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input." }, { status: 400 });
    }

    const { name, email, password } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ error: "Email already registered." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { user, isFirstUser } = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { name, email, passwordHash },
        select: { id: true, email: true, name: true },
      });

      // Check inside the transaction to avoid TOCTOU race on first-user detection
      const orgCount = await tx.organization.count();
      const firstUser = orgCount === 0;

      if (firstUser) {
        // Create the default organization and make this user ADMIN
        const org = await tx.organization.upsert({
          where: { slug: "default" },
          update: {},
          create: { name: "My Organization", slug: "default" },
        });

        await tx.organizationMember.create({
          data: {
            userId: newUser.id,
            organizationId: org.id,
            role: "ADMIN",
            status: "ACTIVE",
          },
        });
      } else {
        // Join the existing organization with PENDING status (admin must approve)
        const org = await tx.organization.findFirst({
          orderBy: { createdAt: "asc" },
        });

        if (!org) throw new Error("No organization found. Contact your administrator.");

        await tx.organizationMember.create({
          data: {
            userId: newUser.id,
            organizationId: org.id,
            role: "MEMBER",
            status: "PENDING",
          },
        });
      }

      return { user: newUser, isFirstUser: firstUser };
    });

    return Response.json(
      {
        ...user,
        pending: !isFirstUser,
        message: isFirstUser
          ? "Account created. You are the organization admin."
          : "Account created. An admin must approve your access before you can log in.",
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed. Please try again.";
    return Response.json({ error: message }, { status: 500 });
  }
}
