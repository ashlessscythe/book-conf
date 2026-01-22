import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/crypto";

export async function requireTabletSession(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!token) {
    throw new Error("Unauthorized");
  }

  const tokenHash = hashToken(token);
  const now = new Date();

  const tablet = await prisma.tablet.findFirst({
    where: {
      sessionTokenHash: tokenHash,
      sessionExpiresAt: { gt: now },
      revokedAt: null,
    },
  });

  if (!tablet) {
    throw new Error("Unauthorized");
  }

  return tablet;
}
