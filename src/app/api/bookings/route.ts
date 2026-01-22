import { NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";
import { bufferedWindow, validateBookingInput } from "@/lib/booking";

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

    const { bufferedStart, bufferedEnd } = bufferedWindow(
      startDate,
      endDate,
      room.bufferMinutes,
    );

    const booking = await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${roomId}))`;

        const conflict = await tx.booking.findFirst({
          where: {
            organizationId: room.organizationId,
            roomId,
            status: "ACTIVE",
            deletedAt: null,
            startAt: { lt: bufferedEnd },
            endAt: { gt: bufferedStart },
          },
          select: { id: true },
        });

        if (conflict) {
          throw new Error("Time slot is not available");
        }

        return tx.booking.create({
          data: {
            organizationId: room.organizationId,
            roomId,
            createdById: session.user.id,
            title: typeof title === "string" ? title : null,
            startAt: startDate,
            endAt: endDate,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Time slot is not available") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Unable to create booking" }, { status: 400 });
  }
}
