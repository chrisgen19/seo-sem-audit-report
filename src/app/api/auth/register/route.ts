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

    // Check if any organization exists — first user becomes ADMIN
    const orgCount = await db.organization.count();
    const isFirstUser = orgCount === 0;

    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { name, email, passwordHash },
        select: { id: true, email: true, name: true },
      });

      if (isFirstUser) {
        // Create the default organization and make this user ADMIN
        const org = await tx.organization.create({
          data: {
            name: "My Organization",
            slug: "default",
          },
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

        if (org) {
          await tx.organizationMember.create({
            data: {
              userId: newUser.id,
              organizationId: org.id,
              role: "MEMBER",
              status: "PENDING",
            },
          });
        }
      }

      return newUser;
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
    console.error("[register]", error);
    return Response.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
