"use client";

import { useEffect, useState } from "react";
import { addComment, deleteComment, listComments } from "@/app/actions/comments";
import { getInitials } from "@/lib/board-utils";
import { canDeleteComment } from "@/lib/roles";

function formatDate(date) {
  return new Date(date).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CardComments({ cardId, canComment, currentUser }) {
  // null while loading, so "no comments yet" is never shown before the answer arrives.
  const [comments, setComments] = useState(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    // Ignores a late answer if the modal was closed or switched to another card.
    let cancelled = false;
    listComments(cardId)
      .then((result) => !cancelled && setComments(result.comments))
      .catch(() => !cancelled && setError("Impossible de charger les commentaires."));
    return () => {
      cancelled = true;
    };
  }, [cardId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    const result = await addComment({ cardId, body });
    setPending(false);
    if (result.error) return setError(result.error);
    setComments((prev) => [...prev, result.comment]);
    setBody("");
    setError(null);
  }

  async function handleDelete(comment) {
    if (!confirm("Supprimer ce commentaire ?")) return;
    const result = await deleteComment(comment.id);
    if (result.error) return setError(result.error);
    setComments((prev) => prev.filter((existing) => existing.id !== comment.id));
  }

  return (
    <section aria-label="Commentaires" className="space-y-3 border-t border-slate-200 pt-4">
      <h3 className="text-sm font-semibold">
        Commentaires {comments && <span className="font-normal text-slate-500">{comments.length}</span>}
      </h3>

      {comments === null && !error && <p className="text-sm text-slate-500">Chargement…</p>}
      {comments?.length === 0 && <p className="text-sm text-slate-500">Aucun commentaire pour l’instant.</p>}

      {comments?.length > 0 && (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700"
              >
                {getInitials(comment.author.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500">
                  <span className="font-medium text-slate-800">{comment.author.name}</span> ·{" "}
                  {formatDate(comment.createdAt)}
                </p>
                <p className="whitespace-pre-wrap break-words text-sm">{comment.body}</p>
              </div>
              {canDeleteComment(comment, currentUser) && (
                <button
                  type="button"
                  onClick={() => handleDelete(comment)}
                  aria-label={`Supprimer le commentaire de ${comment.author.name}`}
                  className="h-6 shrink-0 rounded px-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canComment && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Écrire un commentaire…"
            aria-label="Nouveau commentaire"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
          <div className="flex justify-end">
            <button
              disabled={pending || !body.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {pending ? "Envoi…" : "Commenter"}
            </button>
          </div>
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
