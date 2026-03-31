import type { PersistedSession } from "@/shared/types/domain";

export function evaluateWorkspaceAccess(
  sessionRole: PersistedSession["role"] | null,
  requiredRole: PersistedSession["role"],
) {
  if (!sessionRole) return "redirect-login";
  if (sessionRole !== requiredRole) return "redirect-forbidden";
  return "allow";
}
