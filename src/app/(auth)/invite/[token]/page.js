import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { acceptInvitation } from "@/app/actions/invitations";
import { getInvitationStatus } from "@/lib/invitations";
import { ROLE_LABELS } from "@/lib/constants";
import SubmitButton from "@/components/SubmitButton";

export const metadata = { title: "Invitation · TaskFlow" };

const MESSAGES = {
  invalid: {
    title: "Invitation invalide",
    text: "Ce lien d'invitation n'existe pas ou a été supprimé.",
    link: { href: "/", label: "Retour à l'accueil" },
  },
  expired: {
    title: "Invitation expirée",
    text: "Ce lien n'est plus valable. Demandez une nouvelle invitation à un administrateur de l'espace.",
    link: { href: "/", label: "Retour à l'accueil" },
  },
  member: {
    title: "Déjà membre",
    text: "Vous faites déjà partie de cet espace de travail.",
    link: { href: "/dashboard", label: "Voir mes tableaux" },
  },
};

export default async function InvitePage({ params }) {
  const { token } = await params;
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { workspace: { select: { name: true } }, createdBy: { select: { name: true } } },
  });

  const session = await auth();
  const userId = session?.user?.id;
  const membership =
    invitation && userId
      ? await prisma.membership.findUnique({
          where: { userId_workspaceId: { userId, workspaceId: invitation.workspaceId } },
        })
      : null;

  const status = getInvitationStatus(invitation, { isMember: Boolean(membership) });

  // A dead link is reported right away: no point in logging in for nothing.
  if (status !== "valid") {
    const { title, text, link } = MESSAGES[status];
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="text-sm text-slate-600">{text}</p>
        <Link href={link.href} className="inline-block text-sm font-medium text-indigo-600 hover:underline">
          {link.label}
        </Link>
      </div>
    );
  }

  if (!userId) redirect(`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`);

  return (
    <div className="space-y-4 text-center">
      <h1 className="text-lg font-semibold">Rejoindre « {invitation.workspace.name} »</h1>
      <p className="text-sm text-slate-600">
        {invitation.createdBy.name} vous invite à rejoindre cet espace de travail avec le rôle{" "}
        <strong>{ROLE_LABELS[invitation.role]}</strong>.
      </p>
      <form action={acceptInvitation.bind(null, token)}>
        <SubmitButton className="w-full" pendingText="Ajout en cours…">
          Rejoindre
        </SubmitButton>
      </form>
    </div>
  );
}
