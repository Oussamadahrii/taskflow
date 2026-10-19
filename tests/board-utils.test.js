import { describe, expect, it } from "vitest";
import { findColumnOfCard, moveCard } from "@/lib/board-utils";

const columns = [
  { id: "todo", cards: [{ id: "a" }, { id: "b" }, { id: "c" }] },
  { id: "done", cards: [{ id: "d" }] },
];

const ids = (cols) => cols.map((column) => column.cards.map((card) => card.id));

describe("findColumnOfCard", () => {
  it("returns the column containing the card", () => {
    expect(findColumnOfCard(columns, "d").id).toBe("done");
  });

  it("returns undefined for an unknown card", () => {
    expect(findColumnOfCard(columns, "zzz")).toBeUndefined();
  });
});

describe("moveCard", () => {
  it("reorders a card inside the same column", () => {
    expect(ids(moveCard(columns, "a", "todo", 2))).toEqual([["b", "c", "a"], ["d"]]);
  });

  it("moves a card to another column at the given index", () => {
    expect(ids(moveCard(columns, "b", "done", 0))).toEqual([["a", "c"], ["b", "d"]]);
  });

  it("updates the columnId of the moved card", () => {
    const result = moveCard(columns, "b", "done", 0);
    expect(result[1].cards[0].columnId).toBe("done");
  });

  it("clamps an out-of-range index to the end of the column", () => {
    expect(ids(moveCard(columns, "a", "done", 99))).toEqual([["b", "c"], ["d", "a"]]);
  });

  it("does not mutate the original columns", () => {
    moveCard(columns, "a", "done", 0);
    expect(ids(columns)).toEqual([["a", "b", "c"], ["d"]]);
  });
});
