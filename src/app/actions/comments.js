"use server";

import { prisma } from "@/lib/prisma";
import { requireCardAccess } from "@/lib/access";
import { canDeleteComment } from "@/lib/roles";
import { createCommentSchema } from "@/lib/validations";

const withAuthor = { author: { select: { id: true, name: true } } };

// Loaded when a card is opened rather than with the board, so a board with
// many comments doesn't send all of them on every page load.
export async function listComments(cardId) {
  await requireCardAccess(cardId);
  const comments = await prisma.comment.findMany({
    where: { cardId },
    orderBy: { createdAt: "asc" },
    include: withAuthor,
  });
  return { comments };
}

export async function addComment(input) {
  const parsed = createCommentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { cardId, body } = parsed.data;

  const { user } = await requireCardAccess(cardId, { write: true });
  const comment = await prisma.comment.create({
    data: { cardId, body, authorId: user.id },
    include: withAuthor,
  });
  return { comment };
}

export async function deleteComment(commentId) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return { error: "Ce commentaire n'existe plus." };

  // Access is checked through the card, so the role is the one held in this workspace.
  const { user, membership } = await requireCardAccess(comment.cardId);
  if (!canDeleteComment(comment, { userId: user.id, role: membership.role })) {
    return { error: "Vous ne pouvez supprimer que vos propres commentaires." };
  }

  await prisma.comment.delete({ where: { id: commentId } });
  return { ok: true };
}
