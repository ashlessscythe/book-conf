import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guards";

export async function GET() {
  try {
    const session = await requireSession();
    const rooms = await prisma.room.findMany({
      where: {
        organizationId: session.user.organizationId,
        deletedAt: null,
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json({ rooms });
  } catch (error) {
    return NextResponse.json({ error: "Unable to load rooms" }, { status: 400 });
  }
}
