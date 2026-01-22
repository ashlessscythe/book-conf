import { NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";
import { createBookingWithCredentials, validateBookingInput } from "@/lib/booking";
import { sendBookingCreatedEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const session = await requireRole([Role.ADMIN, Role.USER]);
    const body = await request.json();
    const { roomId, startAt, endAt, title } = body ?? {};

    if (!roomId || !startAt || !endAt) {
      return NextResponse.json(
        { error: "roomId, startAt, and endAt are required" },
        { status: 400 },
      );
    }

    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        organizationId: session.user.organizationId,
        deletedAt: null,
      },
      include: {
        organization: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const { startAt: startDate, endAt: endDate } = validateBookingInput(
      { startAt, endAt },
      room,
      room.organization.timeZone,
    );

    const booking = await prisma.$transaction(
      async (tx) => {
        return createBookingWithCredentials({
          tx,
          room,
          userId: session.user.id,
          title: typeof title === "string" ? title : null,
          startAt: startDate,
          endAt: endDate,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    const responsePayload = {
      booking: booking.booking,
      credentials: {
        pin: booking.pin,
        qrToken: booking.qrToken,
      },
    };

    if (session.user.email) {
      try {
        await sendBookingCreatedEmail({
          to: session.user.email,
          roomName: room.name,
          organizationName: room.organization.name,
          startAt: booking.booking.startAt,
          endAt: booking.booking.endAt,
          pin: booking.pin,
          qrToken: booking.qrToken,
        });
      } catch (error) {
        // Email failures should not block booking creation.
      }
    }

    return NextResponse.json(responsePayload, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Time slot is not available") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Unable to create booking" }, { status: 400 });
  }
}
