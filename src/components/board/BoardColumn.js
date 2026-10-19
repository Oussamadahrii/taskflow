"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { createCard } from "@/app/actions/cards";
import { deleteColumn } from "@/app/actions/columns";
import CardItem from "./CardItem";

export default function BoardColumn({ column, canEdit, onOpenCard, onCardCreated, onDeleted, onError }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  async function handleAddCard(event) {
    event.preventDefault();
    if (!title.trim()) return;
    const result = await createCard({ columnId: column.id, title });
    if (result.error) return onError(result.error);
    onCardCreated(result.card);
    setTitle("");
  }

  async function handleDelete() {
    const message = column.cards.length
      ? `Supprimer « ${column.title} » et ses ${column.cards.length} cartes ?`
      : `Supprimer « ${column.title} » ?`;
    if (!confirm(message)) return;
    await deleteColumn(column.id);
    onDeleted();
  }

  return (
    <section className="flex w-72 shrink-0 flex-col rounded-xl bg-slate-200/70 p-3">
      <header className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold">
          {column.title} <span className="font-normal text-slate-500">{column.cards.length}</span>
        </h2>
        {canEdit && (
          <button
            onClick={handleDelete}
            aria-label={`Supprimer la colonne ${column.title}`}
            className="rounded px-1.5 text-slate-500 hover:bg-slate-300 hover:text-slate-800"
          >
            ×
          </button>
        )}
      </header>

      <SortableContext items={column.cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
        <ul
          ref={setNodeRef}
          className={`flex min-h-12 flex-col gap-2 rounded-lg transition ${isOver ? "bg-indigo-100/60" : ""}`}
        >
          {column.cards.map((card) => (
            <CardItem key={card.id} card={card} disabled={!canEdit} onOpen={() => onOpenCard(card)} />
          ))}
        </ul>
      </SortableContext>

      {canEdit &&
        (adding ? (
          <form onSubmit={handleAddCard} className="mt-2 space-y-2">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setAdding(false)}
              maxLength={120}
              placeholder="Titre de la carte"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
            <div className="flex gap-2">
              <button className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500">
                Ajouter
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-300"
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="mt-2 rounded-lg px-2 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-300"
          >
            + Ajouter une carte
          </button>
        ))}
    </section>
  );
}
