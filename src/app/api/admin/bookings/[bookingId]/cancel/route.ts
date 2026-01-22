import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";
import { sendBookingCanceledEmail } from "@/lib/email";

type RouteParams = {
  params: Promise<{
    bookingId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await requireRole([Role.ADMIN]);
    const { bookingId } = await params;

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        organizationId: session.user.organizationId,
        deletedAt: null,
      },
      include: {
        room: true,
        organization: true,
        createdBy: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status === "CANCELED") {
      return NextResponse.json({ booking });
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELED",
        canceledAt: new Date(),
        canceledById: session.user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: session.user.organizationId,
        action: "ADMIN_OVERRIDE",
        actorType: "USER",
        actorUserId: session.user.id,
        bookingId: updated.id,
        metadata: {
          reason: "admin_cancel",
        },
      },
    });

    if (booking.createdBy?.email) {
      try {
        await sendBookingCanceledEmail({
          to: booking.createdBy.email,
          roomName: booking.room.name,
          organizationName: booking.organization.name,
          startAt: booking.startAt,
          endAt: booking.endAt,
        });
      } catch (error) {
        // Email failures should not block cancellations.
      }
    }

    return NextResponse.json({ booking: updated });
  } catch (error) {
    return NextResponse.json({ error: "Unable to cancel booking" }, { status: 400 });
  }
}
