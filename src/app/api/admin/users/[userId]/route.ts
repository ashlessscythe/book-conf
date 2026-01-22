import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";

type RouteParams = {
  params: Promise<{
    userId: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await requireRole([Role.ADMIN]);
    const { userId } = await params;
    const body = await request.json();
    const role = body?.role;

    if (!Object.values(Role).includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: {
        id: userId,
        organizationId: session.user.organizationId,
      },
      data: {
        role,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: "Unable to update user" }, { status: 400 });
  }
}
