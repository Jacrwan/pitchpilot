import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

function parsePost(text: string): { title: string; body: string } {
  const bodyIndex = text.indexOf("\nBody:");
  if (bodyIndex === -1) {
    // Fallback: return everything as body
    return { title: "", body: text.trim() };
  }

  const titlePart = text.slice(0, bodyIndex);
  const bodyPart = text.slice(bodyIndex + "\nBody:".length);

  const title = titlePart.replace(/^Title:\s*/i, "").trim();
  const body = bodyPart.trim();

  return { title, body };
}

export async function POST(request: NextRequest) {
  const { startupDescription, currentUpdate } = await request.json();

  if (!startupDescription?.trim() || !currentUpdate?.trim()) {
    return NextResponse.json(
      { error: "Both fields are required." },
      { status: 400 }
    );
  }

  const prompt = `You are a startup founder writing a Reddit post. Write exactly how a real person types on Reddit -- not a press release, not a blog post.

Startup: ${startupDescription}
What's happening now: ${currentUpdate}

Rules (follow all of them):
- No em-dashes (-- is fine, — is not)
- No bullet points or numbered lists
- No headers or bold text
- No corporate words: "leverage", "streamline", "excited to announce", "thrilled", "game-changer", "innovative", "solution", "ecosystem"
- Short paragraphs, 1-3 sentences each
- Lowercase is fine. Typos are fine. Contractions are good.
- Lead with something real -- a problem you hit, a thing that surprised you, a number that changed
- Don't oversell. Redditors hate that.
- End with a genuine question or a soft invite for feedback, not a CTA
- Title should be curiosity-driven, not a headline -- like something you'd actually click on Reddit

Format your response as:
Title: [title]
Body: [body]`;

  let message;
  try {
    message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system:
        "You are a tool for startup founders. Only generate Reddit posts and replies related to startups, products, and entrepreneurship. If asked to do anything else, respond with: 'Pitchpilot is designed for startup promotion only.'",
      messages: [{ role: "user", content: prompt }],
    });
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "AI generation failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  const { title, body } = parsePost(text);

  return NextResponse.json({ title, body });
}
