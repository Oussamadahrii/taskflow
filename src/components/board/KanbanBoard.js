"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { moveCard as moveCardAction } from "@/app/actions/cards";
import { findColumnOfCard, moveCard } from "@/lib/board-utils";
import AddColumn from "./AddColumn";
import BoardColumn from "./BoardColumn";
import CardItem from "./CardItem";
import CardModal from "./CardModal";

export default function KanbanBoard({ boardId, initialColumns, members, currentUser, canEdit }) {
  const [columns, setColumns] = useState(initialColumns);
  const [activeCard, setActiveCard] = useState(null);
  const [openCard, setOpenCard] = useState(null);
  const [error, setError] = useState(null);

  // Server revalidation sends fresh data: it becomes the new source of truth.
  useEffect(() => setColumns(initialColumns), [initialColumns]);

  const sensors = useSensors(
    // A small distance lets a simple click open the card instead of starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function columnIdOf(id) {
    if (columns.some((column) => column.id === id)) return id;
    return findColumnOfCard(columns, id)?.id;
  }

  function handleDragStart({ active }) {
    setActiveCard(findColumnOfCard(columns, active.id)?.cards.find((c) => c.id === active.id));
  }

  // Moving across columns happens live while dragging, so the target column
  // makes room for the card before it is dropped.
  function handleDragOver({ active, over }) {
    if (!over) return;
    const from = columnIdOf(active.id);
    const to = columnIdOf(over.id);
    if (!from || !to || from === to) return;

    setColumns((prev) => {
      const target = prev.find((column) => column.id === to);
      const overIndex = target.cards.findIndex((card) => card.id === over.id);
      return moveCard(prev, active.id, to, overIndex >= 0 ? overIndex : target.cards.length);
    });
  }

  async function handleDragEnd({ active, over }) {
    setActiveCard(null);
    if (!over) {
      setColumns(initialColumns);
      return;
    }

    const to = columnIdOf(over.id);
    const target = columns.find((column) => column.id === to);
    const oldIndex = target.cards.findIndex((card) => card.id === active.id);
    const overIndex = target.cards.findIndex((card) => card.id === over.id);
    const newIndex = overIndex >= 0 ? overIndex : oldIndex;

    setColumns(moveCard(columns, active.id, to, newIndex));

    const result = await moveCardAction({ cardId: active.id, toColumnId: to, toIndex: newIndex });
    if (result?.error) {
      setError(result.error);
      setColumns(initialColumns);
    }
  }

  function updateColumn(columnId, update) {
    setColumns((prev) => prev.map((column) => (column.id === columnId ? update(column) : column)));
  }

  return (
    <div className="flex-1 overflow-x-auto px-4 pb-6 sm:px-6">
      {error && (
        <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}{" "}
          <button onClick={() => setError(null)} className="font-medium underline">
            Fermer
          </button>
        </p>
      )}

      <DndContext
        id={`board-${boardId}`}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveCard(null);
          setColumns(initialColumns);
        }}
      >
        <div className="flex items-start gap-4">
          {columns.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
              canEdit={canEdit}
              onOpenCard={setOpenCard}
              onCardCreated={(card) =>
                updateColumn(column.id, (c) => ({ ...c, cards: [...c.cards, card] }))
              }
              onDeleted={() => setColumns((prev) => prev.filter((c) => c.id !== column.id))}
              onError={setError}
            />
          ))}
          {canEdit && (
            <AddColumn
              boardId={boardId}
              onCreated={(column) => setColumns((prev) => [...prev, column])}
              onError={setError}
            />
          )}
        </div>

        <DragOverlay>{activeCard && <CardItem card={activeCard} overlay />}</DragOverlay>
      </DndContext>

      {openCard && (
        <CardModal
          card={openCard}
          members={members}
          currentUser={currentUser}
          canEdit={canEdit}
          onClose={() => setOpenCard(null)}
          onSaved={(card) =>
            updateColumn(card.columnId, (c) => ({
              ...c,
              cards: c.cards.map((existing) => (existing.id === card.id ? card : existing)),
            }))
          }
          onDeleted={(card) =>
            updateColumn(card.columnId, (c) => ({
              ...c,
              cards: c.cards.filter((existing) => existing.id !== card.id),
            }))
          }
        />
      )}
    </div>
  );
}
