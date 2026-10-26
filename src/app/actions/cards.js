"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCardAccess, requireColumnAccess } from "@/lib/access";
import { createCardSchema, moveCardSchema, updateCardSchema } from "@/lib/validations";

async function boardIdOfColumn(columnId) {
  const column = await prisma.column.findUnique({
    where: { id: columnId },
    select: { boardId: true },
  });
  return column.boardId;
}

export async function createCard(input) {
  const parsed = createCardSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { columnId, title } = parsed.data;

  await requireColumnAccess(columnId, { write: true });
  const count = await prisma.card.count({ where: { columnId } });
  const card = await prisma.card.create({
    data: { columnId, title, position: count },
  });

  revalidatePath(`/boards/${await boardIdOfColumn(columnId)}`);
  return { card };
}

export async function updateCard(input) {
  const parsed = updateCardSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { cardId, title, description, dueDate, assigneeId } = parsed.data;

  const { membership } = await requireCardAccess(cardId, { write: true });

  // The id comes from the client: only a member of this workspace can be assigned.
  if (assigneeId) {
    const assignee = await prisma.membership.findUnique({
      where: { userId_workspaceId: { userId: assigneeId, workspaceId: membership.workspaceId } },
    });
    if (!assignee) return { error: "Cette personne n'est pas membre de l'espace de travail." };
  }

  const card = await prisma.card.update({
    where: { id: cardId },
    data: { title, description: description || null, dueDate, assigneeId },
    include: { assignee: { select: { id: true, name: true } } },
  });

  revalidatePath(`/boards/${await boardIdOfColumn(card.columnId)}`);
  return { card };
}

export async function deleteCard(cardId) {
  await requireCardAccess(cardId, { write: true });
  const card = await prisma.card.delete({ where: { id: cardId } });

  // Close the gap left in the column so positions stay contiguous.
  await prisma.card.updateMany({
    where: { columnId: card.columnId, position: { gt: card.position } },
    data: { position: { decrement: 1 } },
  });

  revalidatePath(`/boards/${await boardIdOfColumn(card.columnId)}`);
  return { ok: true };
}

export async function moveCard(input) {
  const parsed = moveCardSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { cardId, toColumnId, toIndex } = parsed.data;

  await requireCardAccess(cardId, { write: true });
  await requireColumnAccess(toColumnId, { write: true });

  const card = await prisma.card.findUnique({ where: { id: cardId } });
  const toBoardId = await boardIdOfColumn(toColumnId);
  if (toBoardId !== (await boardIdOfColumn(card.columnId))) {
    return { error: "Impossible de déplacer une carte vers un autre tableau." };
  }

  await prisma.$transaction(async (tx) => {
    // Rebuild the order of the destination column with the card inserted,
    // then rewrite positions of both affected columns.
    const targetCards = await tx.card.findMany({
      where: { columnId: toColumnId, id: { not: cardId } },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    const ordered = targetCards.map((c) => c.id);
    ordered.splice(Math.min(toIndex, ordered.length), 0, cardId);

    await Promise.all(
      ordered.map((id, position) =>
        tx.card.update({ where: { id }, data: { columnId: toColumnId, position } }),
      ),
    );

    if (card.columnId !== toColumnId) {
      const sourceCards = await tx.card.findMany({
        where: { columnId: card.columnId },
        orderBy: { position: "asc" },
        select: { id: true },
      });
      await Promise.all(
        sourceCards.map(({ id }, position) =>
          tx.card.update({ where: { id }, data: { position } }),
        ),
      );
    }
  });

  revalidatePath(`/boards/${toBoardId}`);
  return { ok: true };
}
