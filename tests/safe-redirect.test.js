import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/safe-redirect";

describe("safeRedirectPath", () => {
  it("keeps a local path", () => {
    expect(safeRedirectPath("/invite/abc")).toBe("/invite/abc");
  });

  it("falls back when there is no callback", () => {
    expect(safeRedirectPath(null)).toBe("/dashboard");
  });

  it.each(["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)"])(
    "rejects %s",
    (value) => {
      expect(safeRedirectPath(value)).toBe("/dashboard");
    },
  );
});
