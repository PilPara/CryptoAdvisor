import { users } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { eq } from "drizzle-orm";

export async function POST() {
  const { userId } = await auth();

  if (!userId) return NextResponse.json({}, { status: 401 });

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  return NextResponse.json(existing[0] ?? null);
}
