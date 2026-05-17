# Phase 6 — Comment Monitoring

## Goal
App checks for new comments on the founder's posted threads every hour and displays them on the dashboard.

## Deliverables
- Vercel cron job runs every hour
- Fetches new comments on all tracked posts
- Stores new comments in Supabase
- Dashboard shows unread comments grouped by post

## Steps
1. Create `comments` table in Supabase

2. Build `/api/cron/fetch-comments` route:
   - Loops through all posts in `posts` table
   - For each post, fetch comments: `https://oauth.reddit.com/comments/{post_id}` using founder's token
   - Compare against stored comments — save only new ones
   - Mark as unread

3. Configure Vercel cron in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/fetch-comments",
      "schedule": "0 * * * *"
    }
  ]
}
```

4. Build comments section on dashboard:
   - Group by post
   - Show commenter username, comment text, timestamp
   - Unread badge on new comments
   - Mark as read when viewed

## Supabase Table
```sql
create table comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  reddit_comment_id text unique,
  author text,
  body text,
  created_utc bigint,
  is_read boolean default false,
  fetched_at timestamptz default now()
);
```

## Done When
- Post a test post to Reddit
- Leave a comment on it from another account
- Wait for cron to run (or trigger manually via browser)
- Comment appears in dashboard
- Unread indicator shows
