export const dynamic = "force-dynamic";

import { auth, currentUser } from "@clerk/nextjs/server";
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

  // get user's name for dashboard heading
  const clerkUser = await currentUser();
  const firstName = clerkUser?.firstName?.trim();
  const heading = firstName ? `${firstName}'s Dashboard` : "Your Dashboard";

  const user = await db.select().from(users).where(eq(users.clerkId, userId));

  // check if user already exist in db and if not insert to users table
  let dbUser = user[0];
  if (!dbUser) {
    const inserted = await db
      .insert(users)
      .values({ clerkId: userId })
      .returning();
    dbUser = inserted[0];
  }

  // check if user already have preferences or first time user
  const prefs = await db
    .select()
    .from(preferences)
    .where(eq(preferences.userId, dbUser.id))
    .limit(1);

  // get first time users to onboarding process
  if (prefs.length === 0) redirect("/onboarding");

  // get preferences of existing user
  const userPrefs = prefs[0];
  const contentTypes = userPrefs.contentTypes;

  // figure out what to show to user based on prefereneces
  const showPrices = contentTypes.includes("prices");
  const showNews = contentTypes.includes("news");
  const showInsight = contentTypes.includes("social");
  const showMeme = contentTypes.includes("fun");

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold">{heading}</h1>
        <p className="mt-1 text-muted-foreground">
          Personalized crypto insights based on your preferences
        </p>
      </div>

      {/* Top row: prices + news side by side, or single column */}
      {showPrices && showNews && (
        <SyncedRow
          left={<CoinPrices assets={userPrefs.assets} />}
          right={<MarketNews assets={userPrefs.assets} />}
        />
      )}

      {/* render logic based on preferences */}
      {showPrices && !showNews && <CoinPrices assets={userPrefs.assets} />}
      {!showPrices && showNews && <MarketNews assets={userPrefs.assets} />}

      {/* Bottom row: insight + meme */}
      {(showInsight || showMeme) && (
        <div className="grid gap-6 md:grid-cols-2">
          {showInsight && (
            <AiInsight
              assets={userPrefs.assets}
              investorType={userPrefs.investorType}
            />
          )}
          {showMeme && <CryptoMeme />}
        </div>
      )}
    </div>
  );
}
