import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";

export async function POST() {
  const { userId } = await auth();

  if (!userId) return NextResponse.json({}, { status: 401 });

  const existing = await db.select().from(users);
}
