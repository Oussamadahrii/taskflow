"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireBoardAccess, requireColumnAccess } from "@/lib/access";
import { columnSchema } from "@/lib/validations";

export async function createColumn(input) {
  const parsed = columnSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { boardId, title } = parsed.data;

  await requireBoardAccess(boardId, { write: true });
  const count = await prisma.column.count({ where: { boardId } });
  const column = await prisma.column.create({
    data: { boardId, title, position: count },
  });

  revalidatePath(`/boards/${boardId}`);
  return { column: { ...column, cards: [] } };
}

export async function deleteColumn(columnId) {
  await requireColumnAccess(columnId, { write: true });
  const column = await prisma.column.delete({ where: { id: columnId } });
  revalidatePath(`/boards/${column.boardId}`);
  return { ok: true };
}
