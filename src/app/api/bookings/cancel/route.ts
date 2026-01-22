import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";

export async function POST(request: Request) {
  try {
    const session = await requireRole([Role.ADMIN, Role.USER]);
    const body = await request.json();
    const { bookingId } = body ?? {};

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        organizationId: session.user.organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        createdById: true,
        status: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (
      session.user.role !== Role.ADMIN &&
      booking.createdById !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.status === "CANCELED") {
      return NextResponse.json({ booking }, { status: 200 });
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELED",
        canceledAt: new Date(),
        canceledById: session.user.id,
      },
    });

    return NextResponse.json({ booking: updated }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Unable to cancel booking" }, { status: 400 });
  }
}
