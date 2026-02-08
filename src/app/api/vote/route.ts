import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, votes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const VALID_SECTIONS = ["prices", "news", "insight", "meme"];
const VALID_VOTES = [1, -1];

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({}, { status: 401 });

  const body = await request.json();
  const { section, contentId, vote } = body;

  if (
    !VALID_SECTIONS.includes(section) ||
    typeof contentId !== "string" ||
    !contentId ||
    !VALID_VOTES.includes(vote)
  ) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  if (user.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const dbUserId = user[0].id;

  // Check for existing vote
  const existing = await db
    .select()
    .from(votes)
    .where(
      and(
        eq(votes.userId, dbUserId),
        eq(votes.section, section),
        eq(votes.contentId, contentId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    if (existing[0].vote === vote) {
      // Same vote — remove it (toggle off)
      await db.delete(votes).where(eq(votes.id, existing[0].id));
      return NextResponse.json({ vote: null });
    } else {
      // Different vote — update it
      await db
        .update(votes)
        .set({ vote, createdAt: new Date() })
        .where(eq(votes.id, existing[0].id));
      return NextResponse.json({ vote });
    }
  }

  // New vote — insert
  await db.insert(votes).values({
    userId: dbUserId,
    section,
    contentId,
    vote,
  });

  return NextResponse.json({ vote });
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({}, { status: 401 });

  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section");

  if (!section || !VALID_SECTIONS.includes(section)) {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  if (user.length === 0) {
    return NextResponse.json({ votes: {} });
  }

  const userVotes = await db
    .select()
    .from(votes)
    .where(and(eq(votes.userId, user[0].id), eq(votes.section, section)));

  // Return as a map of contentId -> vote value
  const voteMap: Record<string, number> = {};
  for (const v of userVotes) {
    voteMap[v.contentId] = v.vote;
  }

  return NextResponse.json({ votes: voteMap });
}
