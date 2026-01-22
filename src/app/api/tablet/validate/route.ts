import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/crypto";
import { requireTabletSession } from "@/lib/tablet";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_FAILURES = 5;

type ValidationBody =
  | { pin: string }
  | { bookingId: string; qrToken: string };

async function recordAttempt(params: {
  organizationId: string;
  tabletId: string;
  bookingId?: string | null;
  success: boolean;
  method: "PIN" | "QR";
  reason?: string;
}) {
  await prisma.auditLog.create({
    data: {
      organizationId: params.organizationId,
      action: "BOOKING_VALIDATED",
      actorType: "TABLET",
      actorTabletId: params.tabletId,
      bookingId: params.bookingId ?? null,
      metadata: {
        success: params.success,
        method: params.method,
        reason: params.reason,
      },
    },
  });
}

export async function POST(request: Request) {
  try {
    const tablet = await requireTabletSession(request);
    const now = new Date();

    const failureCount = await prisma.auditLog.count({
      where: {
        actorTabletId: tablet.id,
        action: "BOOKING_VALIDATED",
        createdAt: { gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) },
        metadata: {
          path: ["success"],
          equals: false,
        },
      },
    });

    if (failureCount >= RATE_LIMIT_MAX_FAILURES) {
      return NextResponse.json(
        { error: "Too many attempts, try again later" },
        { status: 429 },
      );
    }

    const body = (await request.json()) as ValidationBody;
    const hasPin = typeof (body as { pin?: string }).pin === "string";
    const hasQr =
      typeof (body as { bookingId?: string }).bookingId === "string" &&
      typeof (body as { qrToken?: string }).qrToken === "string";

    if (!hasPin && !hasQr) {
      return NextResponse.json(
        { error: "Provide a pin or bookingId + qrToken" },
        { status: 400 },
      );
    }

    let credential;
    let method: "PIN" | "QR";

    if (hasPin) {
      const { pin } = body as { pin: string };
      const pinHash = hashToken(pin);
      method = "PIN";
      credential = await prisma.bookingCredential.findFirst({
        where: {
          organizationId: tablet.organizationId,
          type: "PIN",
          tokenHash: pinHash,
          expiresAt: { gt: now },
          booking: {
            roomId: tablet.roomId,
            status: "ACTIVE",
            deletedAt: null,
          },
        },
        include: {
          booking: true,
        },
      });
    } else {
      const { bookingId, qrToken } = body as {
        bookingId: string;
        qrToken: string;
      };
      const qrHash = hashToken(qrToken);
      method = "QR";
      credential = await prisma.bookingCredential.findFirst({
        where: {
          organizationId: tablet.organizationId,
          bookingId,
          type: "QR",
          tokenHash: qrHash,
          expiresAt: { gt: now },
          booking: {
            roomId: tablet.roomId,
            status: "ACTIVE",
            deletedAt: null,
          },
        },
        include: {
          booking: true,
        },
      });
    }

    if (!credential) {
      await recordAttempt({
        organizationId: tablet.organizationId,
        tabletId: tablet.id,
        success: false,
        method,
        reason: "credential_not_found",
      });
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (now < credential.booking.startAt || now > credential.booking.endAt) {
      await recordAttempt({
        organizationId: tablet.organizationId,
        tabletId: tablet.id,
        bookingId: credential.bookingId,
        success: false,
        method,
        reason: "outside_time_window",
      });
      return NextResponse.json({ error: "Booking not valid now" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.bookingCredential.update({
        where: { id: credential.id },
        data: {
          lastUsedAt: now,
        },
      }),
      prisma.tablet.update({
        where: { id: tablet.id },
        data: {
          lastSeenAt: now,
        },
      }),
    ]);

    await recordAttempt({
      organizationId: tablet.organizationId,
      tabletId: tablet.id,
      bookingId: credential.bookingId,
      success: true,
      method,
    });

    return NextResponse.json({
      booking: {
        id: credential.booking.id,
        roomId: credential.booking.roomId,
        title: credential.booking.title,
        startAt: credential.booking.startAt,
        endAt: credential.booking.endAt,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Unable to validate booking" }, { status: 400 });
  }
}
