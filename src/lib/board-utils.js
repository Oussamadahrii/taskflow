// Pure helpers shared by the client (optimistic UI) and the tests.
// `columns` is an array of { id, cards: [{ id, ... }] } ordered by position.

export function findColumnOfCard(columns, cardId) {
  return columns.find((column) => column.cards.some((card) => card.id === cardId));
}

export function moveCard(columns, cardId, toColumnId, toIndex) {
  const fromColumn = findColumnOfCard(columns, cardId);
  if (!fromColumn) return columns;
  const card = fromColumn.cards.find((c) => c.id === cardId);

  const withoutCard = columns.map((column) =>
    column.id === fromColumn.id
      ? { ...column, cards: column.cards.filter((c) => c.id !== cardId) }
      : column,
  );

  return withoutCard.map((column) => {
    if (column.id !== toColumnId) return column;
    const cards = [...column.cards];
    const index = Math.max(0, Math.min(toIndex, cards.length));
    cards.splice(index, 0, { ...card, columnId: toColumnId });
    return { ...column, cards };
  });
}

// "Ada Lovelace" -> "AL". Two letters at most so the badge stays round.
export function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}
