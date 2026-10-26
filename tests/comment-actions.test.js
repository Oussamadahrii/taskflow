import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { requireCardAccess } from "@/lib/access";
import { addComment, deleteComment, listComments } from "@/app/actions/comments";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    comment: { findMany: vi.fn(async () => []), create: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
  },
}));
// By default the session user is u1, a plain MEMBER of the card's workspace.
vi.mock("@/lib/access", () => ({
  requireCardAccess: vi.fn(async () => ({ user: { id: "u1" }, membership: { role: "MEMBER" } })),
}));

beforeEach(() => vi.clearAllMocks());

describe("listComments", () => {
  it("checks read access and lists the oldest comments first", async () => {
    await listComments("c1");

    expect(requireCardAccess).toHaveBeenCalledWith("c1");
    expect(prisma.comment.findMany.mock.calls[0][0]).toMatchObject({
      where: { cardId: "c1" },
      orderBy: { createdAt: "asc" },
    });
  });
});

describe("addComment", () => {
  it("takes the author from the session, never from the input", async () => {
    await addComment({ cardId: "c1", body: "  Salut  ", authorId: "someone-else" });

    expect(requireCardAccess).toHaveBeenCalledWith("c1", { write: true });
    expect(prisma.comment.create.mock.calls[0][0].data).toEqual({ cardId: "c1", body: "Salut", authorId: "u1" });
  });

  it("refuses an empty comment", async () => {
    const result = await addComment({ cardId: "c1", body: "   " });

    expect(result.error).toBe("Le commentaire est vide");
    expect(prisma.comment.create).not.toHaveBeenCalled();
  });
});

describe("deleteComment", () => {
  it("lets the author delete their comment", async () => {
    prisma.comment.findUnique.mockResolvedValueOnce({ id: "k1", cardId: "c1", authorId: "u1" });

    expect(await deleteComment("k1")).toEqual({ ok: true });
    expect(prisma.comment.delete).toHaveBeenCalledWith({ where: { id: "k1" } });
  });

  it("refuses another member's comment", async () => {
    prisma.comment.findUnique.mockResolvedValueOnce({ id: "k1", cardId: "c1", authorId: "u2" });

    const result = await deleteComment("k1");

    expect(result.error).toBe("Vous ne pouvez supprimer que vos propres commentaires.");
    expect(prisma.comment.delete).not.toHaveBeenCalled();
  });

  it("lets an admin of the workspace moderate", async () => {
    prisma.comment.findUnique.mockResolvedValueOnce({ id: "k1", cardId: "c1", authorId: "u2" });
    requireCardAccess.mockResolvedValueOnce({ user: { id: "u1" }, membership: { role: "ADMIN" } });

    expect(await deleteComment("k1")).toEqual({ ok: true });
  });

  it("reports a comment that no longer exists", async () => {
    prisma.comment.findUnique.mockResolvedValueOnce(null);

    expect((await deleteComment("gone")).error).toBe("Ce commentaire n'existe plus.");
  });
});
