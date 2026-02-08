import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, preferences } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  VALID_ASSET_IDS,
  VALID_INVESTOR_TYPE_IDS,
  VALID_CONTENT_TYPE_IDS,
} from "@/lib/constants";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({}, { status: 401 });

  const body = await request.json();
  const { assets, investorType, contentTypes } = body;

  // validate input
  if (
    !Array.isArray(assets) ||
    assets.length === 0 ||
    !assets.every((asset: string) => VALID_ASSET_IDS.includes(asset))
  ) {
    return NextResponse.json({ error: "Invalid assets" }, { status: 400 });
  }

  if (!VALID_INVESTOR_TYPE_IDS.includes(investorType)) {
    return NextResponse.json(
      { error: "Invalid investor type" },
      { status: 400 },
    );
  }

  if (
    !Array.isArray(contentTypes) ||
    contentTypes.length === 0 ||
    !contentTypes.every((contentType: string) =>
      VALID_CONTENT_TYPE_IDS.includes(contentType),
    )
  ) {
    return NextResponse.json(
      { error: "Invalid content types" },
      { status: 400 },
    );
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  if (user.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // prevent duplicate preferences
  const existing = await db
    .select()
    .from(preferences)
    .where(eq(preferences.userId, user[0].id))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "Preferences already exist" },
      { status: 409 },
    );
  }

  await db.insert(preferences).values({
    userId: user[0].id,
    assets,
    investorType,
    contentTypes,
  });

  return NextResponse.json({ ok: true });
}
