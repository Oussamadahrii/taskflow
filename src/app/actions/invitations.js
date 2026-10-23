"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, requireWorkspaceAdmin } from "@/lib/access";
import { createInvitationSchema } from "@/lib/validations";
import { INVITATION_TTL_DAYS } from "@/lib/constants";
import { getInvitationStatus } from "@/lib/invitations";

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

export async function acceptInvitation(token) {
  const user = await requireUser();
  const invitation = await prisma.invitation.findUnique({ where: { token } });

  // Checked again here: the page may have been opened before the link expired.
  if (getInvitationStatus(invitation) !== "valid") redirect(`/invite/${encodeURIComponent(token)}`);

  try {
    await prisma.membership.create({
      data: { userId: user.id, workspaceId: invitation.workspaceId, role: invitation.role },
    });
  } catch (error) {
    // P2002 = unique constraint on (userId, workspaceId): already a member, e.g.
    // after a double click. The existing role is kept on purpose.
    if (error.code !== "P2002") throw error;
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
