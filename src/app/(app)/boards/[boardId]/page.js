import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireBoardAccess } from "@/lib/access";
import { deleteBoard } from "@/app/actions/boards";
import KanbanBoard from "@/components/board/KanbanBoard";

export async function generateMetadata({ params }) {
  const { boardId } = await params;
  await requireBoardAccess(boardId);
  const board = await prisma.board.findUnique({ where: { id: boardId }, select: { title: true } });
  return { title: `${board.title} · TaskFlow` };
}

export default async function BoardPage({ params }) {
  const { boardId } = await params;
  const { membership } = await requireBoardAccess(boardId);
  const canEdit = membership.role !== "VIEWER";

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      columns: {
        orderBy: { position: "asc" },
        include: { cards: { orderBy: { position: "asc" } } },
      },
    },
  });

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-700">
            ← Mes tableaux
          </Link>
          <h1 className="truncate text-xl font-bold">{board.title}</h1>
        </div>
        {canEdit && (
          <form action={deleteBoard.bind(null, board.id)}>
            <button className="rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
              Supprimer le tableau
            </button>
          </form>
        )}
      </div>
      <KanbanBoard boardId={board.id} initialColumns={board.columns} canEdit={canEdit} />
    </main>
  );
}
