import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";

const anthropic = new Anthropic();

async function refreshRedditToken(refreshToken: string) {
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
      ).toString("base64")}`,
      "User-Agent": "web:pitchpilot:0.1",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) return null;
  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

async function generateReply(
  postTitle: string,
  postBody: string,
  commentAuthor: string,
  commentBody: string
): Promise<string | null> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `You are helping a startup founder respond to a comment on their Reddit post.

Startup context from post: ${postTitle}

Original post: ${postBody}

Comment from ${commentAuthor}: ${commentBody}

Write a reply that:
- Sounds like the founder wrote it personally
- Is conversational, not corporate
- Directly addresses what the commenter said
- Is 2-4 sentences max
- Does not start with "Great question!" or similar filler
- Feels human and grateful without being sycophantic`,
        },
      ],
    });
    return message.content[0].type === "text"
      ? message.content[0].text.trim()
      : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, user_id, reddit_post_id, title, body")
    .eq("status", "posted")
    .not("reddit_post_id", "is", null);

  if (!posts?.length) {
    return NextResponse.json({ message: "No posts to check." });
  }

  // Group posts by user to minimise token fetches
  const byUser = new Map<string, typeof posts>();
  for (const post of posts) {
    if (!byUser.has(post.user_id)) byUser.set(post.user_id, []);
    byUser.get(post.user_id)!.push(post);
  }

  let totalNew = 0;

  for (const [userId, userPosts] of byUser.entries()) {
    const { data: tokenRow } = await supabase
      .from("reddit_tokens")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (!tokenRow) continue;

    let accessToken = tokenRow.access_token;

    if (new Date(tokenRow.expires_at) <= new Date()) {
      const refreshed = await refreshRedditToken(tokenRow.refresh_token);
      if (!refreshed) continue;
      accessToken = refreshed.access_token;
      await supabase
        .from("reddit_tokens")
        .update({
          access_token: accessToken,
          expires_at: new Date(
            Date.now() + refreshed.expires_in * 1000
          ).toISOString(),
        })
        .eq("user_id", userId);
    }

    for (const post of userPosts) {
      await new Promise((r) => setTimeout(r, 500));

      const res = await fetch(
        `https://oauth.reddit.com/comments/${post.reddit_post_id}.json?limit=100`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "User-Agent": "web:pitchpilot:0.1",
          },
        }
      );

      if (!res.ok) continue;

      const payload = await res.json();
      const children: Array<{
        kind: string;
        data: {
          id: string;
          author: string;
          body: string;
          created_utc: number;
        };
      }> = payload[1]?.data?.children ?? [];

      const { data: existing } = await supabase
        .from("comments")
        .select("reddit_comment_id")
        .eq("post_id", post.id);

      const seen = new Set(
        (existing ?? []).map(
          (r: { reddit_comment_id: string }) => r.reddit_comment_id
        )
      );

      const toInsert = children
        .filter(
          (c) =>
            c.kind === "t1" &&
            !seen.has(c.data.id) &&
            c.data.author !== "[deleted]" &&
            c.data.body !== "[removed]"
        )
        .map((c) => ({
          post_id: post.id,
          user_id: userId,
          reddit_comment_id: c.data.id,
          author: c.data.author,
          body: c.data.body,
          created_utc: c.data.created_utc,
        }));

      if (toInsert.length === 0) continue;

      const { data: inserted } = await supabase
        .from("comments")
        .insert(toInsert)
        .select("id, author, body");

      totalNew += toInsert.length;

      // Generate AI reply drafts for each new comment
      if (inserted) {
        for (const comment of inserted) {
          const reply = await generateReply(
            post.title,
            post.body,
            comment.author,
            comment.body
          );
          if (reply) {
            await supabase
              .from("comments")
              .update({ suggested_reply: reply })
              .eq("id", comment.id);
          }
        }
      }
    }
  }

  return NextResponse.json({ message: `Done. ${totalNew} new comments stored.` });
}
