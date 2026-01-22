import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guards";
import { validateBookingInput } from "@/lib/booking";

type RouteParams = {
  params: {
    roomId: string;
  };
};

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await requireSession();
    const { roomId } = params;
    const { searchParams } = new URL(request.url);
    const startAt = searchParams.get("startAt");
    const endAt = searchParams.get("endAt");

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

    const bookings = await prisma.booking.findMany({
      where: {
        organizationId: room.organizationId,
        roomId,
        status: "ACTIVE",
        deletedAt: null,
        startAt: { lt: endDate },
        endAt: { gt: startDate },
      },
      orderBy: {
        startAt: "asc",
      },
      select: {
        id: true,
        title: true,
        startAt: true,
        endAt: true,
      },
    });

    return NextResponse.json({
      room: {
        id: room.id,
        name: room.name,
        availabilityStartMinutes: room.availabilityStartMinutes,
        availabilityEndMinutes: room.availabilityEndMinutes,
        bufferMinutes: room.bufferMinutes,
        timeZone: room.timeZone || room.organization.timeZone,
      },
      bookings,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to fetch availability" },
      { status: 400 },
    );
  }
}
