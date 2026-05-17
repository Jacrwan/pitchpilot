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

  const prompt = `You are helping a startup founder write an authentic Reddit post to share their product update.

Startup: ${startupDescription}
Current update: ${currentUpdate}

Write a Reddit post that:
- Sounds like a real founder wrote it, not a marketer
- Is conversational and honest
- Leads with the story/journey, not the product pitch
- Ends with a soft call to action or question to spark discussion
- Has a title and a body

Format:
Title: [title here]
Body: [body here]`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  const { title, body } = parsePost(text);

  return NextResponse.json({ title, body });
}
