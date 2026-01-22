import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { Resend } from "resend";

import { prisma } from "@/lib/prisma";

function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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
