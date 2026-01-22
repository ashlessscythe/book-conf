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

prismaAdapter.createUser = async (data) => {
  const organization = await resolveOrganization();
  const adminEmail = normalizeEmail(process.env.INITIAL_ADMIN_EMAIL_ADDRESS);
  const email = normalizeEmail(data.email);
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
          subject: "Sign in to Conference Rooms",
          html: `
            <p>Use the link below to sign in:</p>
            <p><a href="${url}">${url}</a></p>
            <p>If you did not request this email, you can ignore it.</p>
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
