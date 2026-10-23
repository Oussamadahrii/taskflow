import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageMembers } from "@/lib/roles";

const WRITE_ROLES = ["OWNER", "ADMIN", "MEMBER"];

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

// Every board check goes through the workspace membership, so a user can never
// read or modify a board just by guessing its id.
async function requireMembership(where, { write }) {
  const user = await requireUser();
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, workspace: where },
  });
  if (!membership) notFound();
  if (write && !WRITE_ROLES.includes(membership.role)) {
    throw new Error("Vous n'avez pas les droits pour modifier ce tableau.");
  }
  return { user, membership };
}

export function requireBoardAccess(boardId, { write = false } = {}) {
  return requireMembership({ boards: { some: { id: boardId } } }, { write });
}

export function requireColumnAccess(columnId, { write = false } = {}) {
  return requireMembership(
    { boards: { some: { columns: { some: { id: columnId } } } } },
    { write },
  );
}

export function requireCardAccess(cardId, { write = false } = {}) {
  return requireMembership(
    { boards: { some: { columns: { some: { cards: { some: { id: cardId } } } } } } },
    { write },
  );
}

export function requireWorkspaceAccess(workspaceId) {
  return requireMembership({ id: workspaceId }, { write: false });
}

// Managing members (invitations, roles) is reserved to owners and admins.
export async function requireWorkspaceAdmin(workspaceId) {
  const { user, membership } = await requireWorkspaceAccess(workspaceId);
  if (!canManageMembers(membership.role)) {
    throw new Error("Seuls les propriétaires et administrateurs peuvent gérer les membres.");
  }
  return { user, membership };
}