import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAdmin } from "@/lib/access";
import { acceptInvitation, createInvitation } from "@/app/actions/invitations";

// vi.mock is hoisted above the imports: the action only ever sees these fakes,
// so the tests need neither a database nor a session.
vi.mock("@/lib/prisma", () => ({
  prisma: {
    invitation: { create: vi.fn(), findUnique: vi.fn() },
    membership: { create: vi.fn() },
  },
}));
vi.mock("@/lib/access", () => ({
  requireUser: vi.fn(async () => ({ id: "u1" })),
  requireWorkspaceAdmin: vi.fn(async () => ({ user: { id: "u1" } })),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
// Like the real one, redirect() stops the action by throwing.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

function form(fields) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});

afterEach(() => vi.useRealTimers());

describe("createInvitation", () => {
  it("stores a 256-bit token that expires in 7 days", async () => {
    const result = await createInvitation(null, form({ workspaceId: "w1", role: "VIEWER" }));

    // 32 bytes in base64url = 43 characters, without padding.
    expect(result.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(prisma.invitation.create).toHaveBeenCalledWith({
      data: {
        token: result.token,
        role: "VIEWER",
        expiresAt: new Date("2026-01-08T00:00:00Z"),
        workspaceId: "w1",
        createdById: "u1",
      },
    });
  });

  it("checks admin rights on the requested workspace", async () => {
    await createInvitation(null, form({ workspaceId: "w1" }));
    expect(requireWorkspaceAdmin).toHaveBeenCalledWith("w1");
  });

  it("refuses an OWNER invitation without touching the database", async () => {
    const result = await createInvitation(null, form({ workspaceId: "w1", role: "OWNER" }));

    expect(result.error).toBe("Rôle invalide");
    expect(prisma.invitation.create).not.toHaveBeenCalled();
  });
});

describe("acceptInvitation", () => {
  const invitation = { workspaceId: "w1", role: "ADMIN", expiresAt: new Date("2026-01-05T00:00:00Z") };

  it("adds the user with the invited role", async () => {
    prisma.invitation.findUnique.mockResolvedValueOnce(invitation);

    await expect(acceptInvitation("tok")).rejects.toThrow("REDIRECT:/dashboard");
    expect(prisma.membership.create).toHaveBeenCalledWith({
      data: { userId: "u1", workspaceId: "w1", role: "ADMIN" },
    });
  });

  it("sends an expired link back to the invite page", async () => {
    prisma.invitation.findUnique.mockResolvedValueOnce({ ...invitation, expiresAt: new Date("2025-12-31T00:00:00Z") });

    await expect(acceptInvitation("tok")).rejects.toThrow("REDIRECT:/invite/tok");
    expect(prisma.membership.create).not.toHaveBeenCalled();
  });

  it("ignores a duplicate membership", async () => {
    prisma.invitation.findUnique.mockResolvedValueOnce(invitation);
    prisma.membership.create.mockRejectedValueOnce(Object.assign(new Error("Unique constraint"), { code: "P2002" }));

    await expect(acceptInvitation("tok")).rejects.toThrow("REDIRECT:/dashboard");
  });
});
