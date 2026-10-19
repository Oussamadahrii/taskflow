import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/access";
import CreateBoardForm from "@/components/CreateBoardForm";

export const metadata = { title: "Mes tableaux · TaskFlow" };

export default async function DashboardPage() {
  const user = await requireUser();
  const boards = await prisma.board.findMany({
    where: { workspace: { memberships: { some: { userId: user.id } } } },
    orderBy: { createdAt: "desc" },
    include: {
      workspace: { select: { name: true } },
      columns: { select: { _count: { select: { cards: true } } } },
    },
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mes tableaux</h1>
          <p className="text-sm text-slate-600">Bonjour {user.name} 👋</p>
        </div>
        <CreateBoardForm />
      </div>

      {boards.length === 0 ? (
        <p className="mt-10 text-center text-slate-500">Aucun tableau pour l’instant. Créez-en un !</p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => {
            const cardCount = board.columns.reduce((sum, column) => sum + column._count.cards, 0);
            return (
              <li key={board.id}>
                <Link
                  href={`/boards/${board.id}`}
                  className="block h-full rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-sm"
                >
                  <h2 className="font-semibold">{board.title}</h2>
                  <p className="mt-1 text-xs text-slate-500">{board.workspace.name}</p>
                  <p className="mt-4 text-sm text-slate-600">
                    {board.columns.length} colonnes · {cardCount} cartes
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
