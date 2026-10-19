"use client";

import { useState } from "react";
import { createColumn } from "@/app/actions/columns";

export default function AddColumn({ boardId, onCreated, onError }) {
  const [title, setTitle] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) return;
    const result = await createColumn({ boardId, title });
    if (result.error) return onError(result.error);
    onCreated(result.column);
    setTitle("");
  }

  return (
    <form onSubmit={handleSubmit} className="w-72 shrink-0 rounded-xl bg-slate-200/40 p-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={50}
        placeholder="+ Ajouter une colonne"
        aria-label="Titre de la nouvelle colonne"
        className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-slate-600 focus:border-slate-300 focus:bg-white"
      />
    </form>
  );
}
