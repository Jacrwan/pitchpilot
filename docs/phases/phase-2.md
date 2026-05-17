# Phase 2 — Reddit OAuth

## Goal
Founder connects their Reddit account. App stores their access token and can make requests on their behalf.

## Deliverables
- Reddit app registered at reddit.com/prefs/apps
- "Connect Reddit" button on dashboard
- OAuth flow: click button → Reddit permission screen → redirect back → token stored
- Reddit username displayed on dashboard after connecting
- Token stored securely in Supabase (linked to user)

## Steps
1. Go to reddit.com/prefs/apps → create app → type: "web app" → note client_id and client_secret
2. Add Reddit OAuth env vars: `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_REDIRECT_URI`
3. Build `/api/auth/reddit` route — redirects to Reddit OAuth URL
4. Build `/api/auth/reddit/callback` route — exchanges code for token, stores in Supabase
5. Create `reddit_tokens` table in Supabase: `user_id`, `access_token`, `refresh_token`, `expires_at`
6. Add "Connect Reddit" button to dashboard
7. After connecting, fetch and display Reddit username using stored token

## Supabase Table
```sql
create table reddit_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  reddit_username text,
  created_at timestamptz default now()
);
```

## Done When
- Click "Connect Reddit" → Reddit permission screen appears
- After approving → redirected back to dashboard
- Reddit username shows on dashboard
- Token exists in Supabase `reddit_tokens` table
