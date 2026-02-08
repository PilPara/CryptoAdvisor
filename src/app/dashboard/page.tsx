export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, preferences } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { CoinPrices } from "@/components/dashboard/coin-prices";
import { MarketNews } from "@/components/dashboard/market-news";
import { AiInsight } from "@/components/dashboard/ai-insight";
import { CryptoMeme } from "@/components/dashboard/crypto-meme";
import { SyncedRow } from "@/components/dashboard/synced-row";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const user = await db.select().from(users).where(eq(users.clerkId, userId));

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

  const userPrefs = prefs[0];

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold">Your Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Personalized crypto insights based on your preferences
        </p>
      </div>

      {/* Top row: Coin prices determines the height, news matches it */}
      <SyncedRow
        left={<CoinPrices assets={userPrefs.assets} />}
        right={<MarketNews assets={userPrefs.assets} />}
      />

      {/* Bottom row */}
      <div className="grid gap-6 md:grid-cols-2">
        <AiInsight
          assets={userPrefs.assets}
          investorType={userPrefs.investorType}
        />
        <CryptoMeme />
      </div>
    </div>
  );
}
