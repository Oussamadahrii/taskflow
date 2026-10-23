import { describe, expect, it } from "vitest";
import { getInvitationStatus } from "@/lib/invitations";

const now = new Date("2026-01-10T12:00:00Z");
const valid = { expiresAt: new Date("2026-01-11T12:00:00Z") };
const expired = { expiresAt: new Date("2026-01-09T12:00:00Z") };

describe("getInvitationStatus", () => {
  it("reports a missing invitation as invalid", () => {
    expect(getInvitationStatus(null, { now })).toBe("invalid");
  });

  it("reports a past expiry date as expired", () => {
    expect(getInvitationStatus(expired, { now })).toBe("expired");
  });

  it("treats the exact expiry instant as expired", () => {
    expect(getInvitationStatus({ expiresAt: now }, { now })).toBe("expired");
  });

  it("reports an existing member", () => {
    expect(getInvitationStatus(valid, { now, isMember: true })).toBe("member");
  });

  it("reports expiry before membership", () => {
    expect(getInvitationStatus(expired, { now, isMember: true })).toBe("expired");
  });

  it("accepts a pending invitation", () => {
    expect(getInvitationStatus(valid, { now })).toBe("valid");
  });
});
