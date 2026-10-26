const ADMIN_ROLES = ["OWNER", "ADMIN"];

// Kept free of database and auth imports so pages and tests can use it directly.
export function canManageMembers(role) {
  return ADMIN_ROLES.includes(role);
}

// Authors remove their own comments; owners and admins can moderate any of them.
export function canDeleteComment(comment, { userId, role }) {
  return comment.authorId === userId || ADMIN_ROLES.includes(role);
}
