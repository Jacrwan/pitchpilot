import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const base = new URL("/dashboard", request.url);

  if (oauthError) {
    base.searchParams.set("error", "Reddit connection cancelled.");
    return NextResponse.redirect(base);
  }

  const storedState = request.cookies.get("reddit_oauth_state")?.value;
  if (!state || state !== storedState) {
    base.searchParams.set("error", "Invalid OAuth state. Please try again.");
    const response = NextResponse.redirect(base);
    response.cookies.delete("reddit_oauth_state");
    return response;
  }

  if (!code) {
    base.searchParams.set("error", "No authorisation code returned by Reddit.");
    const response = NextResponse.redirect(base);
    response.cookies.delete("reddit_oauth_state");
    return response;
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
      ).toString("base64")}`,
      "User-Agent": "web:pitchpilot:0.1",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.REDDIT_REDIRECT_URI!,
    }),
  });

  if (!tokenRes.ok) {
    base.searchParams.set("error", "Failed to exchange Reddit authorisation code.");
    const response = NextResponse.redirect(base);
    response.cookies.delete("reddit_oauth_state");
    return response;
  }

  const { access_token, refresh_token, expires_in } = await tokenRes.json();

  // Fetch Reddit username
  const meRes = await fetch("https://oauth.reddit.com/api/v1/me", {
    headers: {
      Authorization: `Bearer ${access_token}`,
      "User-Agent": "web:pitchpilot:0.1",
    },
  });

  if (!meRes.ok) {
    base.searchParams.set("error", "Failed to fetch Reddit profile.");
    const response = NextResponse.redirect(base);
    response.cookies.delete("reddit_oauth_state");
    return response;
  }

  const { name: reddit_username } = await meRes.json();

  // Store in Supabase, linked to the logged-in user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const expires_at = new Date(Date.now() + expires_in * 1000).toISOString();

  const { error: dbError } = await supabase.from("reddit_tokens").upsert(
    { user_id: user.id, access_token, refresh_token, expires_at, reddit_username },
    { onConflict: "user_id" }
  );

  if (dbError) {
    base.searchParams.set("error", `Database error: ${dbError.message}`);
    const response = NextResponse.redirect(base);
    response.cookies.delete("reddit_oauth_state");
    return response;
  }

  const response = NextResponse.redirect(base);
  response.cookies.delete("reddit_oauth_state");
  return response;
}
