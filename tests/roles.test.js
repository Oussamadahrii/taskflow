import { describe, expect, it } from "vitest";
import { canManageMembers } from "@/lib/roles";

describe("canManageMembers", () => {
  it.each(["OWNER", "ADMIN"])("allows %s", (role) => {
    expect(canManageMembers(role)).toBe(true);
  });

  it.each(["MEMBER", "VIEWER"])("refuses %s", (role) => {
    expect(canManageMembers(role)).toBe(false);
  });
});
