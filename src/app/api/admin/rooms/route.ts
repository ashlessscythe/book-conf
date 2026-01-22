import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { generateRoomId } from "@/lib/id";
import { requireRole } from "@/lib/guards";

export async function GET() {
  try {
    const session = await requireRole([Role.ADMIN]);
    const rooms = await prisma.room.findMany({
      where: {
        organizationId: session.user.organizationId,
        deletedAt: null,
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ rooms });
  } catch (error) {
    return NextResponse.json({ error: "Unable to load rooms" }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole([Role.ADMIN]);
    const body = await request.json();
    const {
      name,
      location,
      capacity,
      availabilityStartMinutes,
      availabilityEndMinutes,
      minDurationMinutes,
      maxDurationMinutes,
      bufferMinutes,
      timeZone,
    } = body ?? {};

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Room name is required" }, { status: 400 });
    }

    let room = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        room = await prisma.room.create({
          data: {
            id: generateRoomId(),
            organizationId: session.user.organizationId,
            name: name.trim(),
            location: typeof location === "string" ? location.trim() : null,
            capacity: typeof capacity === "number" ? capacity : null,
            availabilityStartMinutes:
              typeof availabilityStartMinutes === "number"
                ? availabilityStartMinutes
                : 480,
            availabilityEndMinutes:
              typeof availabilityEndMinutes === "number"
                ? availabilityEndMinutes
                : 1080,
            minDurationMinutes:
              typeof minDurationMinutes === "number" ? minDurationMinutes : 15,
            maxDurationMinutes:
              typeof maxDurationMinutes === "number" ? maxDurationMinutes : 240,
            bufferMinutes: typeof bufferMinutes === "number" ? bufferMinutes : 0,
            timeZone: typeof timeZone === "string" ? timeZone : null,
          },
        });
        break;
      } catch (error) {
        if (attempt === 4) {
          throw error;
        }
      }
    }

    if (!room) {
      return NextResponse.json(
        { error: "Unable to create room" },
        { status: 500 },
      );
    }

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Unable to create room" }, { status: 400 });
  }
}
