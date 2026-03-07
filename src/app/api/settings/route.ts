import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encrypt";
import bcrypt from "bcryptjs";
import { z } from "zod";

const settingsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  geminiApiKey: z.string().optional(),
  geminiModel: z.string().max(100).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      geminiApiKey: true,
      geminiModel: true,
    },
  });

  if (!user) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({
    ...user,
    // Return only whether the key is set, never the raw encrypted value
    geminiApiKey: user.geminiApiKey ? "***set***" : null,
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, geminiApiKey, geminiModel, currentPassword, newPassword } = parsed.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {};
  if (name) updates.name = name;
  if (geminiApiKey !== undefined) {
    updates.geminiApiKey = geminiApiKey ? encrypt(geminiApiKey) : null;
  }
  if (geminiModel !== undefined) updates.geminiModel = geminiModel || null;

  // Password change
  if (newPassword) {
    if (!currentPassword) {
      return Response.json({ error: "Current password required" }, { status: 400 });
    }
    const user = await db.user.findUnique({ where: { id: session.user.id } });
    if (!user?.passwordHash) {
      return Response.json({ error: "Password not set" }, { status: 400 });
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return Response.json({ error: "Current password incorrect" }, { status: 400 });
    }
    updates.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  const user = await db.user.update({
    where: { id: session.user.id },
    data: updates,
    select: { id: true, name: true, email: true },
  });

  return Response.json(user);
}
