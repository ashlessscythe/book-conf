import type { DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      organizationId: string;
    } & DefaultSession["user"];
    pinVerifiedAt?: string | null;
  }

  interface User {
    role: Role;
    organizationId: string;
  }
}
