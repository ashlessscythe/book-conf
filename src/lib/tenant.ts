import { Role } from "@prisma/client";

import { requireSession } from "@/lib/guards";

export type TenantContext = {
  organizationId: string;
  userId: string;
  role: Role;
};

export async function requireTenantContext(): Promise<TenantContext> {
  const session = await requireSession();
  const { organizationId, id: userId, role } = session.user;

  if (!organizationId) {
    throw new Error("Organization required");
  }

  return {
    organizationId,
    userId,
    role,
  };
}

export function tenantScope(organizationId: string) {
  return { organizationId };
}
