import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";

export async function GET() {
  try {
    const session = await requireRole([Role.ADMIN]);
    const users = await prisma.user.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      orderBy: { email: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: "Unable to load users" }, { status: 400 });
  }
}
