import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";

type RouteParams = {
  params: Promise<{
    roomId: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await requireRole([Role.ADMIN]);
    const { roomId } = await params;
    const body = await request.json();

    const room = await prisma.room.update({
      where: {
        id: roomId,
        organizationId: session.user.organizationId,
      },
      data: {
        name: typeof body.name === "string" ? body.name.trim() : undefined,
        location:
          typeof body.location === "string" ? body.location.trim() : undefined,
        capacity: typeof body.capacity === "number" ? body.capacity : undefined,
        availabilityStartMinutes:
          typeof body.availabilityStartMinutes === "number"
            ? body.availabilityStartMinutes
            : undefined,
        availabilityEndMinutes:
          typeof body.availabilityEndMinutes === "number"
            ? body.availabilityEndMinutes
            : undefined,
        minDurationMinutes:
          typeof body.minDurationMinutes === "number"
            ? body.minDurationMinutes
            : undefined,
        maxDurationMinutes:
          typeof body.maxDurationMinutes === "number"
            ? body.maxDurationMinutes
            : undefined,
        bufferMinutes:
          typeof body.bufferMinutes === "number" ? body.bufferMinutes : undefined,
        timeZone: typeof body.timeZone === "string" ? body.timeZone : undefined,
      },
    });

    return NextResponse.json({ room });
  } catch (error) {
    return NextResponse.json({ error: "Unable to update room" }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await requireRole([Role.ADMIN]);
    const { roomId } = await params;

    const room = await prisma.room.update({
      where: {
        id: roomId,
        organizationId: session.user.organizationId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ room });
  } catch (error) {
    return NextResponse.json({ error: "Unable to delete room" }, { status: 400 });
  }
}
