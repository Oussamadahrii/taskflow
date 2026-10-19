"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBoardAccess, requireUser } from "@/lib/access";
import { boardSchema } from "@/lib/validations";
import { DEFAULT_COLUMNS } from "@/lib/constants";

export async function createBoard(_prevState, formData) {
  const user = await requireUser();
  const parsed = boardSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, role: { in: ["OWNER", "ADMIN", "MEMBER"] } },
    orderBy: { role: "asc" },
  });
  if (!membership) return { error: "Aucun espace de travail disponible." };

  const board = await prisma.board.create({
    data: {
      title: parsed.data.title,
      workspaceId: membership.workspaceId,
      columns: {
        create: DEFAULT_COLUMNS.map((title, position) => ({ title, position })),
      },
    },
  });

  redirect(`/boards/${board.id}`);
}

export async function deleteBoard(boardId) {
  await requireBoardAccess(boardId, { write: true });
  await prisma.board.delete({ where: { id: boardId } });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
