import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { hashToken } from "@/lib/crypto";

function getSessionToken() {
  const store = cookies();
  return (
    store.get("__Secure-next-auth.session-token")?.value ||
    store.get("__Host-next-auth.session-token")?.value ||
    store.get("next-auth.session-token")?.value ||
    null
  );
}

async function resolveSession(userId: string) {
  const token = getSessionToken();
  if (token) {
    const session = await prisma.session.findUnique({
      where: { sessionToken: token },
    });
    if (session) {
      return session;
    }
  }

  return prisma.session.findFirst({
    where: {
      userId,
      expires: { gt: new Date() },
    },
    orderBy: { expires: "desc" },
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionRecord = await resolveSession(session.user.id);
  return NextResponse.json({
    verified: Boolean(sessionRecord?.pinVerifiedAt),
    pinVerifiedAt: sessionRecord?.pinVerifiedAt ?? null,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const now = new Date();

  const pin = typeof body?.pin === "string" ? body.pin.trim() : "";
  const challengeId =
    typeof body?.challengeId === "string" ? body.challengeId.trim() : "";
  const token = typeof body?.token === "string" ? body.token.trim() : "";

  if (!pin && !(challengeId && token)) {
    return NextResponse.json(
      { error: "PIN or challenge token required" },
      { status: 400 },
    );
  }

  const challenge = await prisma.loginChallenge.findFirst({
    where: {
      organizationId: session.user.organizationId,
      usedAt: null,
      expiresAt: { gt: now },
      ...(pin
        ? { pinHash: hashToken(pin) }
        : { id: challengeId, tokenHash: hashToken(token) }),
    },
  });

  if (!challenge) {
    return NextResponse.json({ error: "Invalid or expired PIN" }, { status: 400 });
  }

  const sessionRecord = await resolveSession(session.user.id);
  if (!sessionRecord) {
    return NextResponse.json({ error: "Session not found" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.loginChallenge.update({
      where: { id: challenge.id },
      data: { usedAt: now },
    }),
    prisma.session.update({
      where: { id: sessionRecord.id },
      data: { pinVerifiedAt: now },
    }),
  ]);

  return NextResponse.json({ verified: true, pinVerifiedAt: now });
}
