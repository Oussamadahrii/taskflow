import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from "@/lib/access";
import { canManageMembers } from "@/lib/roles";
import { ROLE_LABELS } from "@/lib/constants";
import InviteForm from "@/components/InviteForm";

export const metadata = { title: "Membres · TaskFlow" };

export default async function MembersPage({ params }) {
  const { workspaceId } = await params;
  const { membership } = await requireWorkspaceAccess(workspaceId);

  const [workspace, members] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: workspaceId }, select: { name: true } }),
    prisma.membership.findMany({
      where: { workspaceId },
      // Postgres sorts enums by declaration order: OWNER, ADMIN, MEMBER, VIEWER.
      orderBy: [{ role: "asc" }, { user: { name: "asc" } }],
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-700">
        ← Mes tableaux
      </Link>
      <h1 className="text-2xl font-bold">Membres</h1>
      <p className="text-sm text-slate-600">{workspace.name}</p>

      {canManageMembers(membership.role) && (
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Inviter une personne</h2>
          <p className="mb-4 text-sm text-slate-600">
            Générez un lien et envoyez-le à la personne que vous souhaitez inviter.
          </p>
          <InviteForm workspaceId={workspaceId} />
        </section>
      )}

      <ul className="mt-8 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {members.map(({ id, role, user }) => (
          <li key={id} className="flex items-center justify-between gap-4 px-5 py-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{user.name}</p>
              <p className="truncate text-sm text-slate-500">{user.email}</p>
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              {ROLE_LABELS[role]}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
