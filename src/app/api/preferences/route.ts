import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, preferences } from "@/db/schema";
import { eq } from "drizzle-orm";
import { VALID_ASSET_IDS } from "@/lib/constants";

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({}, { status: 401 });

  const body = await request.json();
  const { assets } = body;

  if (
    !Array.isArray(assets) ||
    assets.length === 0 ||
    !assets.every((a: string) => VALID_ASSET_IDS.includes(a))
  ) {
    return NextResponse.json({ error: "Invalid assets" }, { status: 400 });
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  if (user.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existing = await db
    .select()
    .from(preferences)
    .where(eq(preferences.userId, user[0].id))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json(
      { error: "No preferences found. Complete onboarding first." },
      { status: 404 },
    );
  }

  await db
    .update(preferences)
    .set({ assets })
    .where(eq(preferences.userId, user[0].id));

  return NextResponse.json({ ok: true, assets });
}
