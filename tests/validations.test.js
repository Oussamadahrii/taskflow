import { describe, expect, it } from "vitest";
import { registerSchema, updateCardSchema } from "@/lib/validations";

describe("registerSchema", () => {
  it("normalizes the email", () => {
    const result = registerSchema.parse({ name: "Ada", email: "  Ada@Example.COM ", password: "12345678" });
    expect(result.email).toBe("ada@example.com");
  });

  it("rejects a short password", () => {
    const result = registerSchema.safeParse({ name: "Ada", email: "ada@example.com", password: "123" });
    expect(result.success).toBe(false);
  });
});

describe("updateCardSchema", () => {
  it("turns an empty due date into null", () => {
    const result = updateCardSchema.parse({ cardId: "c1", title: "Tâche", dueDate: "" });
    expect(result.dueDate).toBeNull();
  });

  it("parses a due date", () => {
    const result = updateCardSchema.parse({ cardId: "c1", title: "Tâche", dueDate: "2026-12-31" });
    expect(result.dueDate).toBeInstanceOf(Date);
  });

  it("rejects an invalid due date", () => {
    expect(updateCardSchema.safeParse({ cardId: "c1", title: "Tâche", dueDate: "pas une date" }).success).toBe(false);
  });
});
