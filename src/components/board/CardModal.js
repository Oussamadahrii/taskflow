"use client";

import { useEffect, useState } from "react";
import { deleteCard, updateCard } from "@/app/actions/cards";
import CardComments from "./CardComments";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 disabled:bg-slate-50";

function toDateInput(date) {
  return date ? new Date(date).toISOString().slice(0, 10) : "";
}

export default function CardModal({ card, members, currentUser, canEdit, onClose, onSaved, onDeleted }) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [dueDate, setDueDate] = useState(toDateInput(card.dueDate));
  const [assigneeId, setAssigneeId] = useState(card.assigneeId ?? "");
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function handleSave(event) {
    event.preventDefault();
    setPending(true);
    const result = await updateCard({ cardId: card.id, title, description, dueDate, assigneeId });
    setPending(false);
    if (result.error) return setError(result.error);
    onSaved(result.card);
    onClose();
  }

  async function handleDelete() {
    if (!confirm("Supprimer cette carte ?")) return;
    await deleteCard(card.id);
    onDeleted(card);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 px-4 pt-24"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Détails de la carte"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[calc(100vh-8rem)] w-full max-w-lg space-y-4 overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
      >
        {/* Two sibling forms: HTML does not allow the comment form inside this one. */}
        <form onSubmit={handleSave} className="space-y-4">
          <label className="block text-sm font-medium">
            Titre
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={120}
              disabled={!canEdit}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={2000}
              disabled={!canEdit}
              placeholder="Ajoutez des détails…"
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium">
            Échéance
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={!canEdit}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium">
            Responsable
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              disabled={!canEdit}
              className={inputClass}
            >
              <option value="">Personne</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
  
          {error && <p className="text-sm text-red-600">{error}</p>}
  
          <div className="flex items-center justify-between pt-2">
            {canEdit ? (
              <button type="button" onClick={handleDelete} className="text-sm text-red-600 hover:underline">
                Supprimer
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm hover:bg-slate-100">
                Fermer
              </button>
              {canEdit && (
                <button
                  disabled={pending}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
                >
                  {pending ? "Enregistrement…" : "Enregistrer"}
                </button>
              )}
            </div>
          </div>
        </form>
        <CardComments cardId={card.id} canComment={canEdit} currentUser={currentUser} />
      </div>
    </div>
  );
}
