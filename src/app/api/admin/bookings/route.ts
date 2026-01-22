import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";

export async function GET() {
  try {
    const session = await requireRole([Role.ADMIN]);
    const bookings = await prisma.booking.findMany({
      where: {
        organizationId: session.user.organizationId,
        deletedAt: null,
      },
      orderBy: { startAt: "desc" },
      take: 50,
      include: {
        room: true,
        createdBy: true,
      },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    return NextResponse.json({ error: "Unable to load bookings" }, { status: 400 });
  }
}
