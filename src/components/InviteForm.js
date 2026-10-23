"use client";

import { useActionState, useState } from "react";
import { createInvitation } from "@/app/actions/invitations";
import { INVITATION_TTL_DAYS, ROLE_LABELS } from "@/lib/constants";
import SubmitButton from "@/components/SubmitButton";

const INVITABLE_ROLES = ["ADMIN", "MEMBER", "VIEWER"];

export default function InviteForm({ workspaceId }) {
  const [state, formAction] = useActionState(createInvitation, null);
  // Remembering which token was copied resets the label for each new link.
  const [copiedToken, setCopiedToken] = useState(null);
  const link = state?.token ? `${window.location.origin}/invite/${state.token}` : null;

  async function copyLink() {
    await navigator.clipboard.writeText(link);
    setCopiedToken(state.token);
  }

  return (
    <div className="space-y-3">
      <form action={formAction} className="flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="workspaceId" value={workspaceId} />
        <select
          name="role"
          defaultValue="MEMBER"
          aria-label="Rôle de la personne invitée"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        >
          {INVITABLE_ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
        <SubmitButton pendingText="Génération…" className="shrink-0 text-sm">
          Générer un lien
        </SubmitButton>
      </form>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      {link && (
        <div className="space-y-1">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={link}
              aria-label="Lien d'invitation"
              onFocus={(event) => event.target.select()}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            />
            <button
              type="button"
              onClick={copyLink}
              className="shrink-0 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
            >
              {copiedToken === state.token ? "Copié !" : "Copier"}
            </button>
          </div>
          <p className="text-xs text-slate-500">Ce lien est valable {INVITATION_TTL_DAYS} jours.</p>
        </div>
      )}
    </div>
  );
}
