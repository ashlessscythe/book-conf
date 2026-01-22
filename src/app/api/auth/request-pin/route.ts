import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createCredentialToken, generatePin } from "@/lib/credentials";
import { hashToken } from "@/lib/crypto";
import { sendLoginPinEmail } from "@/lib/email";
import { authOptions } from "@/lib/auth";

const PIN_EXPIRY_MINUTES = 10;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function POST(request: Request) {
  const body = await request.json();
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const isAllowed = await authOptions.callbacks?.signIn?.({
    user: { email } as any,
    account: undefined,
    profile: undefined,
    email: undefined,
    credentials: undefined,
  });

  if (isAllowed === false) {
    return NextResponse.json({ error: "Email not allowed" }, { status: 403 });
  }

  const organization = await prisma.organization.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!organization) {
    return NextResponse.json(
      { error: "Organization not initialized" },
      { status: 400 },
    );
  }

  const pin = generatePin();
  const expiresAt = new Date(Date.now() + PIN_EXPIRY_MINUTES * 60 * 1000);

  const token = createCredentialToken();

  await prisma.loginChallenge.create({
    data: {
      organizationId: organization.id,
      email,
      pinHash: hashToken(pin),
      tokenHash: token.tokenHash,
      expiresAt,
    },
  });

  await sendLoginPinEmail({
    to: email,
    pin,
    expiresAt,
  });

  return NextResponse.json({ ok: true, expiresAt });
}
