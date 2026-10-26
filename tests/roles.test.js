import { describe, expect, it } from "vitest";
import { canDeleteComment, canManageMembers } from "@/lib/roles";

describe("canManageMembers", () => {
  it.each(["OWNER", "ADMIN"])("allows %s", (role) => {
    expect(canManageMembers(role)).toBe(true);
  });

  it.each(["MEMBER", "VIEWER"])("refuses %s", (role) => {
    expect(canManageMembers(role)).toBe(false);
  });
});

describe("canDeleteComment", () => {
  const comment = { authorId: "u1" };

  it("lets the author delete their comment", () => {
    expect(canDeleteComment(comment, { userId: "u1", role: "MEMBER" })).toBe(true);
  });

  it.each(["OWNER", "ADMIN"])("lets %s moderate someone else's comment", (role) => {
    expect(canDeleteComment(comment, { userId: "u2", role })).toBe(true);
  });

  it("refuses another member", () => {
    expect(canDeleteComment(comment, { userId: "u2", role: "MEMBER" })).toBe(false);
  });
});
