import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";

export async function GET() {
  try {
    const session = await requireRole([Role.ADMIN]);
    const logs = await prisma.auditLog.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        actorUser: true,
        actorTablet: true,
        booking: true,
      },
    });

    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json({ error: "Unable to load audit logs" }, { status: 400 });
  }
}
