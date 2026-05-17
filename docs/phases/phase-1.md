# Phase 1 — Auth (Email/Password)

## Goal
Founder can create an account, log in, and see a protected dashboard. No Reddit yet.

## Deliverables
- Supabase project created and connected
- Sign up page (`/signup`)
- Log in page (`/login`)
- Protected dashboard page (`/dashboard`) — blank is fine
- Redirect to /login if not authenticated
- Redirect to /dashboard after successful login
- Log out button on dashboard

## Steps
1. Create Supabase project at supabase.com
2. Add Supabase env vars to `.env.local` and Vercel
3. Install Supabase client: `npm install @supabase/supabase-js @supabase/ssr`
4. Build signup page with email + password form
5. Build login page
6. Add middleware to protect `/dashboard` route
7. Add logout button

## Done When
- Can create a new account with email + password
- Can log in with that account
- `/dashboard` redirects to `/login` when not authenticated
- Logging out redirects back to `/login`
- No console errors
