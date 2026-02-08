import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({}, { status: 401 });

  const { assets, investorType } = await request.json();

  // Try OpenRouter free API, fallback to static insight
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [
          {
            role: "system",
            content:
              "You are a crypto market analyst. Give a short, helpful daily insight (2-3 sentences). Be specific but not financial advice.",
          },
          {
            role: "user",
            content: `I'm a ${investorType} investor interested in ${assets.join(", ")}. Give me a brief insight for today.`,
          },
        ],
        max_tokens: 150,
      }),
    });

    if (!res.ok) throw new Error("OpenRouter API error");

    const data = await res.json();
    const insight = data.choices?.[0]?.message?.content;

    if (!insight) throw new Error("No insight returned");

    return NextResponse.json({ insight });
  } catch {
    return NextResponse.json({
      insight: `As a ${investorType} focused on ${assets.join(", ")}, keep an eye on market trends today. Diversification and staying informed are key to navigating current conditions.`,
    });
  }
}
