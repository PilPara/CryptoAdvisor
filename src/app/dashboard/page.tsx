export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, userId as string));

  if (existing.length === 0) {
    await db.insert(users).values({ clerkId: userId });
  }

  return (
    <div>
      <h1>Dashboard</h1>
    </div>
  );
}
