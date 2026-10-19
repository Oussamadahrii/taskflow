"use server";

import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAdmin } from "@/lib/access";
import { createInvitationSchema } from "@/lib/validations";
import { INVITATION_TTL_DAYS } from "@/lib/constants";

export async function createInvitation(_prevState, formData) {
  const parsed = createInvitationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { workspaceId, role } = parsed.data;

  const { user } = await requireWorkspaceAdmin(workspaceId);

  // 32 random bytes = 256 bits: the link itself is the secret, so it must be unguessable.
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.invitation.create({
    data: { token, role, expiresAt, workspaceId, createdById: user.id },
  });

  return { token };
}
