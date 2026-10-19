"use client";

import { useActionState } from "react";
import { createBoard } from "@/app/actions/boards";
import SubmitButton from "@/components/SubmitButton";

export default function CreateBoardForm() {
  const [state, formAction] = useActionState(createBoard, null);

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <div className="flex gap-2">
        <input
          name="title"
          required
          maxLength={80}
          placeholder="Nom du nouveau tableau"
          aria-label="Nom du nouveau tableau"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 sm:w-64"
        />
        <SubmitButton pendingText="Création…" className="shrink-0 text-sm">
          Créer
        </SubmitButton>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
