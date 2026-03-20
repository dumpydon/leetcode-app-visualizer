import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getPrimaryUser } from "@/lib/services/users";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getPrimaryUser();

    if (!user) {
      return NextResponse.json({ error: "No active user." }, { status: 400 });
    }

    const body = (await request.json()) as {
      problemSlug?: string;
      label?: "REVIEW_LATER" | "REVISIT";
    };

    if (!body.problemSlug || !body.label) {
      return NextResponse.json({ error: "Missing bookmark payload." }, { status: 400 });
    }

    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_problemSlug: {
          userId: user.id,
          problemSlug: body.problemSlug,
        },
      },
    });

    if (existing?.label === body.label) {
      await prisma.bookmark.delete({
        where: { userId_problemSlug: { userId: user.id, problemSlug: body.problemSlug } },
      });
      return NextResponse.json({ ok: true, active: false });
    }

    await prisma.bookmark.upsert({
      where: {
        userId_problemSlug: {
          userId: user.id,
          problemSlug: body.problemSlug,
        },
      },
      create: {
        userId: user.id,
        problemSlug: body.problemSlug,
        label: body.label,
      },
      update: {
        label: body.label,
      },
    });

    return NextResponse.json({ ok: true, active: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Bookmark update failed.",
      },
      { status: 500 }
    );
  }
}
