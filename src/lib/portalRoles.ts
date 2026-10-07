export const portalPaths = {
  admin: "/admin",
  student: "/student",
  teacher: "/teacher",
  accounts: "/accounts",
  parent: "/parent",
} as const;

export type PortalRole = keyof typeof portalPaths;

/** Normalize database role labels and common display names to portal keys. */
export function normalizePortalRole(role?: string | null): PortalRole | null {
  const value = role?.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  if (!value) return null;
  if (["admin", "administrator", "superuser", "staff"].includes(value)) return "admin";
  if (["student", "learner", "pupil"].includes(value)) return "student";
  if (["teacher", "educator", "teaching staff"].includes(value)) return "teacher";
  if (["account", "accounts", "accountant", "accounts officer", "finance", "finance officer"].includes(value)) return "accounts";
  if (["parent", "guardian"].includes(value)) return "parent";
  return null;
}

export function dashboardPathForRole(role?: string | null): string | null {
  const normalizedRole = normalizePortalRole(role);
  return normalizedRole ? portalPaths[normalizedRole] : null;
}
