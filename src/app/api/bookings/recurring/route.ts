import { NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";
import { validateBookingInput, createBookingWithCredentials } from "@/lib/booking";
import { expandRecurrence } from "@/lib/recurrence";
import { sendBookingCreatedEmail } from "@/lib/email";

type RecurringRequest = {
  roomId: string;
  title?: string;
  startAt: string;
  durationMinutes: number;
  frequency: "DAILY" | "WEEKLY";
  interval?: number;
  daysOfWeek?: number[];
  endDate?: string;
  count?: number;
};

export async function POST(request: Request) {
  try {
    const session = await requireRole([Role.ADMIN, Role.USER]);
    const body = (await request.json()) as RecurringRequest;
    const {
      roomId,
      title,
      startAt,
      durationMinutes,
      frequency,
      interval = 1,
      daysOfWeek,
      endDate,
      count,
    } = body;

    if (!roomId || !startAt || !durationMinutes || !frequency) {
      return NextResponse.json(
        { error: "roomId, startAt, durationMinutes, frequency are required" },
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

    const startDate = new Date(startAt);
    if (Number.isNaN(startDate.getTime())) {
      return NextResponse.json({ error: "Invalid startAt" }, { status: 400 });
    }

    const validation = validateBookingInput(
      { startAt, endAt: new Date(startDate.getTime() + durationMinutes * 60000).toISOString() },
      room,
      room.organization.timeZone,
    );

    const occurrences = expandRecurrence({
      startAt: validation.startAt,
      durationMinutes,
      frequency,
      interval,
      daysOfWeek,
      endDate: endDate ? new Date(endDate) : undefined,
      count,
    });

    if (occurrences.length === 0) {
      return NextResponse.json({ error: "No occurrences generated" }, { status: 400 });
    }

    const rule = await prisma.recurringBookingRule.create({
      data: {
        organizationId: room.organizationId,
        roomId: room.id,
        createdById: session.user.id,
        title: typeof title === "string" ? title : null,
        frequency,
        interval,
        daysOfWeek: daysOfWeek ?? [],
        startDate: validation.startAt,
        endDate: endDate ? new Date(endDate) : null,
        startTimeMinutes: validation.startAt.getHours() * 60 + validation.startAt.getMinutes(),
        durationMinutes,
        timeZone: room.timeZone || room.organization.timeZone,
      },
    });

    const results: {
      startAt: Date;
      endAt: Date;
      bookingId?: string;
      error?: string;
    }[] = [];

    for (const occurrence of occurrences) {
      try {
        const created = await prisma.$transaction(
          async (tx) => {
            return createBookingWithCredentials({
              tx,
              room,
              userId: session.user.id,
              title: typeof title === "string" ? title : null,
              startAt: occurrence.startAt,
              endAt: occurrence.endAt,
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );

        await prisma.booking.update({
          where: { id: created.booking.id },
          data: { recurringRuleId: rule.id },
        });

        results.push({
          startAt: occurrence.startAt,
          endAt: occurrence.endAt,
          bookingId: created.booking.id,
        });

        if (session.user.email) {
          await sendBookingCreatedEmail({
            to: session.user.email,
            roomName: room.name,
            organizationName: room.organization.name,
            startAt: created.booking.startAt,
            endAt: created.booking.endAt,
            pin: created.pin,
            qrToken: created.qrToken,
          });
        }
      } catch (error) {
        results.push({
          startAt: occurrence.startAt,
          endAt: occurrence.endAt,
          error: error instanceof Error ? error.message : "Failed to create booking",
        });
      }
    }

    return NextResponse.json({
      ruleId: rule.id,
      results,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Time slot is not available") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Unable to create recurring bookings" }, { status: 400 });
  }
}
