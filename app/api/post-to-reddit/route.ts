import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function refreshToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
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
  return res.json();
}

export async function POST(request: NextRequest) {
  const { subreddit, title, body } = await request.json();

  if (!subreddit?.trim() || !title?.trim() || !body?.trim()) {
    return NextResponse.json(
      { error: "subreddit, title, and body are required." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: tokenRow } = await supabase
    .from("reddit_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!tokenRow) {
    return NextResponse.json(
      { error: "Reddit account not connected." },
      { status: 400 }
    );
  }

  let accessToken = tokenRow.access_token;

  if (new Date(tokenRow.expires_at) <= new Date()) {
    const refreshed = await refreshToken(tokenRow.refresh_token);
    if (!refreshed) {
      return NextResponse.json(
        { error: "Reddit token expired. Please reconnect your Reddit account." },
        { status: 401 }
      );
    }
    accessToken = refreshed.access_token;
    const newExpiresAt = new Date(
      Date.now() + refreshed.expires_in * 1000
    ).toISOString();
    await supabase
      .from("reddit_tokens")
      .update({ access_token: accessToken, expires_at: newExpiresAt })
      .eq("user_id", user.id);
  }

  const submitRes = await fetch("https://oauth.reddit.com/api/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "web:pitchpilot:0.1",
    },
    body: new URLSearchParams({
      sr: subreddit.trim(),
      kind: "self",
      title: title.trim(),
      text: body.trim(),
      resubmit: "true",
    }),
  });

  const submitData = await submitRes.json();

  const errors = submitData?.json?.errors;
  if (errors?.length > 0) {
    return NextResponse.json(
      { error: errors[0][1] ?? "Reddit rejected the post." },
      { status: 400 }
    );
  }

  if (!submitRes.ok) {
    return NextResponse.json(
      { error: "Reddit submission failed. Please try again." },
      { status: 502 }
    );
  }

  const redditUrl = submitData?.json?.data?.url ?? null;
  const redditPostId = submitData?.json?.data?.id ?? null;

  await supabase.from("posts").insert({
    user_id: user.id,
    subreddit: subreddit.trim(),
    title: title.trim(),
    body: body.trim(),
    reddit_post_id: redditPostId,
    reddit_url: redditUrl,
    status: "posted",
  });

  return NextResponse.json({ url: redditUrl });
}
