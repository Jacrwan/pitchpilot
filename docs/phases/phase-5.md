# Phase 5 — Posting to Reddit

## Goal
Founder can post their approved draft to selected subreddits using their own Reddit account.

## Deliverables
- "Post to Reddit" button on each approved community's draft
- Posts to Reddit via founder's stored OAuth token
- Success/failure feedback shown to founder
- Posted submissions stored in Supabase for tracking

## Steps
1. Build `/api/post-to-reddit` route:
   - Input: subreddit name, post title, post body, user_id
   - Fetch founder's token from Supabase
   - POST to `https://oauth.reddit.com/api/submit` with token
   - Return post URL on success

2. Handle token refresh if expired:
   - Check `expires_at` before posting
   - If expired, use refresh_token to get new access_token
   - Update token in Supabase

3. Create `posts` table in Supabase to track submissions

4. Show success state: "Posted! View on Reddit →" with link
5. Show failure state with error message

## Supabase Table
```sql
create table posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  subreddit text not null,
  title text not null,
  body text not null,
  reddit_post_id text,
  reddit_url text,
  posted_at timestamptz default now(),
  status text default 'posted'
);
```

## Reddit Submit Endpoint
```
POST https://oauth.reddit.com/api/submit
Headers: Authorization: Bearer {access_token}
Body:
  sr: subreddit name (no r/)
  kind: self
  title: post title
  text: post body
  resubmit: true
```

## Done When
- Click "Post" → post appears on your actual Reddit account
- Success message with link to post shown
- Post recorded in Supabase `posts` table
- Token refresh works if token is expired
