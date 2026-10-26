import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { updateCard } from "@/app/actions/cards";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    card: { update: vi.fn(async () => ({ id: "c1", columnId: "col1" })) },
    column: { findUnique: vi.fn(async () => ({ boardId: "b1" })) },
    membership: { findUnique: vi.fn() },
  },
}));
// The card lives in workspace w1: that is where the assignee must be a member.
vi.mock("@/lib/access", () => ({
  requireCardAccess: vi.fn(async () => ({ membership: { workspaceId: "w1" } })),
  requireColumnAccess: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const base = { cardId: "c1", title: "Tâche" };
const savedData = () => prisma.card.update.mock.calls[0][0].data;

beforeEach(() => vi.clearAllMocks());

describe("updateCard assignee", () => {
  it("assigns a member of the card's workspace", async () => {
    prisma.membership.findUnique.mockResolvedValueOnce({ id: "m2" });

    const result = await updateCard({ ...base, assigneeId: "u2" });

    expect(result.error).toBeUndefined();
    expect(prisma.membership.findUnique).toHaveBeenCalledWith({
      where: { userId_workspaceId: { userId: "u2", workspaceId: "w1" } },
    });
    expect(savedData().assigneeId).toBe("u2");
  });

  it("refuses someone outside the workspace", async () => {
    prisma.membership.findUnique.mockResolvedValueOnce(null);

    const result = await updateCard({ ...base, assigneeId: "stranger" });

    expect(result.error).toBe("Cette personne n'est pas membre de l'espace de travail.");
    expect(prisma.card.update).not.toHaveBeenCalled();
  });

  it("unassigns the card on an empty value", async () => {
    await updateCard({ ...base, assigneeId: "" });

    expect(prisma.membership.findUnique).not.toHaveBeenCalled();
    expect(savedData().assigneeId).toBeNull();
  });

  it("keeps the current assignee when none is sent", async () => {
    await updateCard(base);

    expect(savedData().assigneeId).toBeUndefined();
  });
});
