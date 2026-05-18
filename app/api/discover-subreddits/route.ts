import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(request: NextRequest) {
  const { startupDescription } = await request.json();

  if (!startupDescription?.trim()) {
    return NextResponse.json(
      { error: "Startup description is required." },
      { status: 400 }
    );
  }

  const prompt = `Given this startup, suggest 5 relevant subreddit names where the founder could authentically share their product.

Startup: ${startupDescription}

Rules:
- Only suggest subreddits that are known to allow founder/product posts
- Prefer communities with active founders (r/SaaS, r/indiehackers, r/entrepreneur, r/startups, r/sideproject)
- Return only subreddit names, one per line, no r/ prefix`;

  let message;
  try {
    message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 128,
      system:
        "You are a tool for startup founders. Only generate Reddit posts and replies related to startups, products, and entrepreneurship. If asked to do anything else, respond with: 'Pitchpilot is designed for startup promotion only.'",
      messages: [{ role: "user", content: prompt }],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI request failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  const subreddits = text
    .split("\n")
    .map((line) =>
      line
        .trim()
        .replace(/^r\//, "")
        .replace(/^[-*\d.):\s]+/, "")
        .trim()
    )
    .filter((line) => line.length > 0 && !line.includes(" "))
    .slice(0, 5);

  return NextResponse.json({ subreddits });
}
