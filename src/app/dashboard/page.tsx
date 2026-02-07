export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, preferences } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const user = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, userId as string));

  let dbUser = user[0];
  if (!dbUser) {
    const inserted = await db
      .insert(users)
      .values({ clerkId: userId })
      .returning();
    dbUser = inserted[0];
  }

  const prefs = await db
    .select()
    .from(preferences)
    .where(eq(preferences.userId, dbUser.id))
    .limit(1);

  if (prefs.length === 0) redirect("/onboarding");

  return (
    <div>
      <h1>Dashboard</h1>
    </div>
  );
}
