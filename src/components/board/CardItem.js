"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function formatDueDate(date) {
  return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function isOverdue(date) {
  return new Date(date) < new Date(new Date().toDateString());
}

export default function CardItem({ card, disabled = false, overlay = false, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    disabled: disabled || overlay,
  });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : style}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      onClick={onOpen}
      className={`list-none cursor-pointer rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm hover:border-indigo-300 ${
        isDragging ? "opacity-40" : ""
      } ${overlay ? "rotate-2 cursor-grabbing shadow-lg" : ""}`}
    >
      <p className="break-words font-medium">{card.title}</p>
      {(card.description || card.dueDate) && (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          {card.dueDate && (
            <span
              className={`rounded px-1.5 py-0.5 ${
                isOverdue(card.dueDate) ? "bg-red-100 text-red-700" : "bg-slate-100"
              }`}
            >
              📅 {formatDueDate(card.dueDate)}
            </span>
          )}
          {card.description && <span title="Cette carte a une description">≡</span>}
        </div>
      )}
    </li>
  );
}
