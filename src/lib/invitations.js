// Pure so the invite page and the accept action share the same rules.
export function getInvitationStatus(invitation, { isMember = false, now = new Date() } = {}) {
  if (!invitation) return "invalid";
  if (invitation.expiresAt <= now) return "expired";
  if (isMember) return "member";
  return "valid";
}
