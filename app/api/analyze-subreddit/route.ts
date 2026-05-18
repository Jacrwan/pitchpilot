import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// TODO: Replace with real Reddit fetching once OAuth is approved.
// TODO: Restore Supabase token lookup (reddit_tokens table) when switching to real fetching.
const client = new Anthropic();

const MOCK_RULES: Record<string, string> = {
  default: `Be helpful: Posts should contribute value to the community.\nNo spam: Don't post purely promotional content without adding context or value.\nSelf-promotion allowed with disclosure: You may share your own projects if you disclose your affiliation and lead with value.\nNo excessive cross-posting: Don't post the same content across many subreddits simultaneously.`,
  SaaS: `Self-promotion allowed: Founders can share their SaaS products.\nBe transparent: Disclose if you built what you're sharing.\nNo pure ads: Posts must have substance — a story, lesson, or question.\nEngage in comments: Respond to feedback and questions from the community.`,
  indiehackers: `Show your work: Share revenue numbers, growth, and real data when possible.\nSelf-promotion welcome: This community exists to support indie founders.\nBe honest: Don't oversell. Share failures as well as wins.\nNo affiliate spam: Affiliate links require disclosure.`,
  entrepreneur: `Provide value: Posts should teach, inspire, or spark useful discussion.\nNo self-promotion without context: You can mention your startup but lead with a lesson.\nNo fundraising solicitations: Don't ask for investment in posts.\nSources required: Back up claims with data or personal experience.`,
  startups: `Founders welcome: Early-stage founders can share their journey.\nConditional self-promotion: Framing matters — share learnings, not just links.\nNo hiring posts: Use the weekly thread for jobs.\nCivil discourse: Critique ideas, not people.`,
  sideproject: `Show what you built: All side projects welcome regardless of stage.\nSelf-promotion encouraged: This subreddit exists to showcase projects.\nFeedback culture: Ask for honest feedback and respond to it.\nNo pure marketing: Include a description of what you built and why.`,
};

const MOCK_POSTS: Record<string, string> = {
  default: `How I went from 0 to 100 users in 30 days without paid ads\nI built a tool that saves me 2 hours a day — here's how I did it\nAsking for feedback on my MVP before I launch\nWhat's your current biggest pain point as a founder?\nI quit my job 6 months ago. Here's what I've learned.\nJust crossed $1k MRR — small milestone but feels huge\nBuilt in public update: week 12\nHow do you handle customer support when you're a solo founder?\nFailed startup #2. Starting #3. AMA.\nWhy I stopped trying to go viral and started talking to users`,
  SaaS: `We hit $10k MRR after 8 months — here's what actually moved the needle\nChurn went from 8% to 3% after one UX change\nBuilt a B2B SaaS as a solo dev. Happy to share what worked.\nDoes anyone else struggle with pricing? How did you find your number?\nOur free trial conversion is 12%. Is that good?\nSwapped our onboarding flow and signups jumped 40%\nMonthly SaaS check-in — share your MRR and biggest challenge\nWhy we killed our enterprise tier\nI analyzed 50 SaaS landing pages. Here's what the best ones do.\nJust launched on Product Hunt — lessons from the first 24 hours`,
  indiehackers: `My indie SaaS crossed $5k MRR — AMA\nBuilt in public: 6 months, $2k revenue, here's every mistake I made\nHow I validated my idea in 2 weeks before writing a line of code\nNo-code vs. code for an MVP — what would you do?\nMonth 3 update: 50 users, 3 paying, one big lesson\nI interviewed 30 potential customers before building. Here's what I heard.\nHow long did it take you to get your first paying customer?\nRevenue report: $847 MRR, 23 customers, solo founder\nI almost quit last month. This is what changed my mind.\nLaunched 14 products. Here's the only one that worked.`,
};

function getMockData(subreddit: string) {
  const key = Object.keys(MOCK_RULES).find(
    (k) => k.toLowerCase() === subreddit.toLowerCase()
  );
  return {
    rules: MOCK_RULES[key ?? "default"],
    recentPosts: MOCK_POSTS[key ?? "default"],
  };
}

export async function POST(request: NextRequest) {
  const { subredditName } = await request.json();

  if (!subredditName?.trim()) {
    return NextResponse.json(
      { error: "Subreddit name is required." },
      { status: 400 }
    );
  }

  const { rules, recentPosts } = getMockData(subredditName.trim());

  const prompt = `Analyze this subreddit for a founder who wants to post about their startup.

Rules page: ${rules}
Recent posts sample: ${recentPosts}

Return a short summary covering:
1. Does this subreddit allow self-promotion? (yes/no/conditional)
2. What tone do posts use here? (technical, casual, storytelling, etc.)
3. One tip for posting successfully in this community

Keep it under 4 sentences total.`;

  let message;
  try {
    message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system:
        "You are a tool for startup founders. Only generate Reddit posts and replies related to startups, products, and entrepreneurship. If asked to do anything else, respond with: 'Pitchpilot is designed for startup promotion only.'",
      messages: [{ role: "user", content: prompt }],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI request failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const raw =
    message.content[0].type === "text" ? message.content[0].text : "";

  const summary = raw
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\n{2,}/g, " ")
    .replace(/\n/g, " ")
    .trim();

  const lower = summary.toLowerCase();
  let allowsSelfPromo: "yes" | "no" | "conditional";
  if (lower.includes("does not allow") || lower.includes("no self-promo") || lower.includes("prohibited") || lower.includes("not allowed")) {
    allowsSelfPromo = "no";
  } else if (lower.includes("conditional") || lower.includes("with context") || lower.includes("under certain") || lower.includes("allowed if") || lower.includes("allowed when") || lower.includes("if it")) {
    allowsSelfPromo = "conditional";
  } else if (lower.includes("yes") || lower.includes("allows self") || lower.includes("welcome") || lower.includes("encouraged")) {
    allowsSelfPromo = "yes";
  } else {
    allowsSelfPromo = "conditional";
  }

  return NextResponse.json({ summary, allowsSelfPromo });
}
