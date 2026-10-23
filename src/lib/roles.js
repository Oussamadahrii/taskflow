const ADMIN_ROLES = ["OWNER", "ADMIN"];

// Kept free of database and auth imports so pages and tests can use it directly.
export function canManageMembers(role) {
  return ADMIN_ROLES.includes(role);
}
