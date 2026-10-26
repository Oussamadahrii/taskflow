import { describe, expect, it } from "vitest";
import { createCommentSchema, createInvitationSchema, registerSchema, updateCardSchema } from "@/lib/validations";

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

  it("turns an empty assignee into null to unassign the card", () => {
    const result = updateCardSchema.parse({ cardId: "c1", title: "Tâche", assigneeId: "" });
    expect(result.assigneeId).toBeNull();
  });

  it("leaves the assignee undefined when it is not sent", () => {
    const result = updateCardSchema.parse({ cardId: "c1", title: "Tâche" });
    expect(result.assigneeId).toBeUndefined();
  });
});

describe("createCommentSchema", () => {
  it("trims the comment", () => {
    expect(createCommentSchema.parse({ cardId: "c1", body: "  Bonjour  " }).body).toBe("Bonjour");
  });

  it("rejects a comment made of spaces", () => {
    expect(createCommentSchema.safeParse({ cardId: "c1", body: "   " }).success).toBe(false);
  });
});

describe("createInvitationSchema", () => {
  it("defaults the role to MEMBER", () => {
    const result = createInvitationSchema.parse({ workspaceId: "w1" });
    expect(result.role).toBe("MEMBER");
  });

  it("never allows inviting an OWNER", () => {
    expect(createInvitationSchema.safeParse({ workspaceId: "w1", role: "OWNER" }).success).toBe(false);
  });
});
