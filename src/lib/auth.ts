import type { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { Role } from "@prisma/client";
import { Resend } from "resend";

import { prisma } from "@/lib/prisma";

const DEFAULT_ORG_NAME = "Default Organization";
const DEFAULT_ORG_TIME_ZONE = "UTC";

function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
}

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function allowedLoginEmails(): string[] {
  const raw = process.env.ALLOWED_LOGIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function isEmailAllowed(email: string): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return false;
  }

  const adminEmail = normalizeEmail(process.env.INITIAL_ADMIN_EMAIL_ADDRESS);
  if (adminEmail && normalized === adminEmail) {
    return true;
  }

  const allowed = allowedLoginEmails();
  if (allowed.length === 0) {
    return true;
  }

  return allowed.includes(normalized);
}

async function resolveOrganization() {
  const existing = await prisma.organization.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return existing;
  }

  return prisma.organization.create({
    data: {
      name: process.env.INITIAL_ORG_NAME || DEFAULT_ORG_NAME,
      timeZone: process.env.INITIAL_ORG_TIME_ZONE || DEFAULT_ORG_TIME_ZONE,
    },
  });
}

const prismaAdapter = PrismaAdapter(prisma) as Adapter;

prismaAdapter.createUser = async (data: any) => {
  const organization = await resolveOrganization();
  const adminEmail = normalizeEmail(process.env.INITIAL_ADMIN_EMAIL_ADDRESS);
  const email = normalizeEmail(data?.email);
  const role = adminEmail && email === adminEmail ? Role.ADMIN : Role.USER;

  return prisma.user.create({
    data: {
      ...data,
      email: email || data.email,
      role,
      organizationId: organization.id,
    },
  });
};

export const authOptions: NextAuthOptions = {
  adapter: prismaAdapter,
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    EmailProvider({
      sendVerificationRequest: async ({ identifier, url }) => {
        const apiKey = requireEnv(
          process.env.RESEND_API_KEY,
          "RESEND_API_KEY",
        );
        const from = requireEnv(process.env.RESEND_FROM, "RESEND_FROM");
        const resend = new Resend(apiKey);
        await resend.emails.send({
          from,
          to: identifier,
          subject: "Sign in to Conference Room Booking",
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2 style="margin: 0 0 12px;">Conference Room Booking</h2>
              <p>Use the button below to sign in.</p>
              <p style="margin: 24px 0;">
                <a href="${url}" style="background:#111827;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none;">
                  Sign in
                </a>
              </p>
              <p>If the button does not work, paste this link into your browser:</p>
              <p><a href="${url}">${url}</a></p>
              <p style="color:#6b7280;">If you did not request this email, you can ignore it.</p>
            </div>
          `,
        });
      },
    }),
  ],
  callbacks: {
    signIn: ({ user }) => {
      if (!user?.email) {
        return false;
      }
      return isEmailAllowed(user.email);
    },
    session: ({ session, user }) => {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.organizationId = user.organizationId;
      }
      return session;
    },
  },
};
