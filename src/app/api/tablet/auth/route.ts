import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { generateToken, tokenMatches, hashToken } from "@/lib/crypto";

const SESSION_DAYS = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tabletId, credential } = body ?? {};

    if (!tabletId || !credential) {
      return NextResponse.json(
        { error: "tabletId and credential are required" },
        { status: 400 },
      );
    }

    const tablet = await prisma.tablet.findFirst({
      where: {
        id: tabletId,
        revokedAt: null,
      },
    });

    if (!tablet || !tokenMatches(String(credential), tablet.credentialHash)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionToken = generateToken();
    const sessionTokenHash = hashToken(sessionToken);
    const sessionExpiresAt = new Date(
      Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
    );

    const updated = await prisma.tablet.update({
      where: { id: tablet.id },
      data: {
        sessionTokenHash,
        sessionExpiresAt,
        lastSeenAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: updated.organizationId,
        action: "TABLET_AUTH",
        actorType: "TABLET",
        actorTabletId: updated.id,
        metadata: {
          success: true,
        },
      },
    });

    return NextResponse.json({
      tabletId: updated.id,
      roomId: updated.roomId,
      sessionToken,
      sessionExpiresAt,
    });
  } catch (error) {
    return NextResponse.json({ error: "Unable to authenticate tablet" }, { status: 400 });
  }
}
