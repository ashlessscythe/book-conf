import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { randomInt } from "crypto";

import { generateToken, hashToken } from "@/lib/crypto";
import { requireTabletSession } from "@/lib/tablet";

const CHALLENGE_MINUTES = 10;

function generatePin(): string {
  const value = randomInt(100000, 1000000);
  return String(value);
}

export async function POST(request: Request) {
  try {
    const tablet = await requireTabletSession(request);
    const pin = generatePin();
    const qrToken = generateToken(16);
    const expiresAt = new Date(Date.now() + CHALLENGE_MINUTES * 60 * 1000);

    const challenge = await prisma.loginChallenge.create({
      data: {
        organizationId: tablet.organizationId,
        tabletId: tablet.id,
        pinHash: hashToken(pin),
        tokenHash: hashToken(qrToken),
        expiresAt,
      },
    });

    return NextResponse.json({
      challengeId: challenge.id,
      pin,
      qrToken,
      expiresAt,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Unable to generate login challenge" },
      { status: 400 },
    );
  }
}
