import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function refreshToken(refreshToken: string) {
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

export async function POST(request: NextRequest) {
  const { commentId, commentRedditId, replyText } = await request.json();

  if (!commentRedditId?.trim() || !replyText?.trim() || !commentId) {
    return NextResponse.json(
      { error: "commentId, commentRedditId, and replyText are required." },
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
    await supabase
      .from("reddit_tokens")
      .update({
        access_token: accessToken,
        expires_at: new Date(
          Date.now() + refreshed.expires_in * 1000
        ).toISOString(),
      })
      .eq("user_id", user.id);
  }

  const replyRes = await fetch("https://oauth.reddit.com/api/comment", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "web:pitchpilot:0.1",
    },
    body: new URLSearchParams({
      thing_id: `t1_${commentRedditId}`,
      text: replyText.trim(),
    }),
  });

  const replyData = await replyRes.json();

  const errors = replyData?.json?.errors;
  if (errors?.length > 0) {
    return NextResponse.json(
      { error: errors[0][1] ?? "Reddit rejected the reply." },
      { status: 400 }
    );
  }

  if (!replyRes.ok) {
    return NextResponse.json(
      { error: "Failed to post reply. Please try again." },
      { status: 502 }
    );
  }

  await supabase
    .from("comments")
    .update({ is_replied: true, replied_at: new Date().toISOString() })
    .eq("id", commentId);

  return NextResponse.json({ ok: true });
}
