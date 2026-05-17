# Phase 7 — AI Reply Suggestions + One-Click Approve

## Goal
For each new comment, AI drafts a reply. Founder reviews and approves with one click. Reply posts to Reddit via their account.

## Deliverables
- AI-generated reply shown beneath each comment
- Founder can edit the reply
- "Approve + Post" button submits reply to Reddit
- Reply stored in Supabase

## Steps
1. Extend comment fetching to auto-generate reply drafts on new comments:
   - After saving new comment, call claude-sonnet-4-20250514
   - Pass: startup context + original post + comment text
   - Store generated reply in `comments` table (`suggested_reply` column)

2. Display suggested reply in dashboard beneath each comment

3. Make reply textarea editable

4. Build `/api/post-reply` route:
   - Input: comment reddit_id, reply text, user_id
   - POST to `https://oauth.reddit.com/api/comment` with founder's token
   - Mark comment as replied in Supabase

5. Show "Replied ✓" state after successful post

## Reply Generation Prompt
```
You are helping a startup founder respond to a comment on their Reddit post.

Startup: {startupDescription}
Original post title: {postTitle}
Comment from {author}: {commentBody}

Write a reply that:
- Sounds like the founder wrote it personally
- Is conversational, not corporate
- Directly addresses what the commenter said
- Is 2-4 sentences max
- Does not start with "Great question!" or similar filler
- Feels human and grateful without being sycophantic
```

## Supabase Changes
Add columns to `comments` table:
```sql
alter table comments add column suggested_reply text;
alter table comments add column is_replied boolean default false;
alter table comments add column replied_at timestamptz;
```

## Done When
- New comment appears → AI reply draft shows automatically
- Edit the reply → click "Approve + Post" → reply appears on Reddit
- Comment marked as replied in dashboard
- No console errors
