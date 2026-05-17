import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: process.env.REDDIT_CLIENT_ID!,
    response_type: "code",
    state,
    redirect_uri: process.env.REDDIT_REDIRECT_URI!,
    duration: "permanent",
    scope: "identity submit read",
  });

  const response = NextResponse.redirect(
    `https://www.reddit.com/api/v1/authorize?${params}`
  );

  response.cookies.set("reddit_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });

  return response;
}
