# Pitchpilot

## What This Is
AI-powered promotion tool for startup founders. Founder inputs their startup description and current update → AI finds relevant communities → drafts platform-native posts → founder approves/edits/skips → posts on their behalf. Premium tier adds comment monitoring and AI-suggested replies.

## Core Philosophy
- Founder is always in control. Nothing posts without explicit approval.
- AI as accelerant, not replacement. Founder still builds relationships — AI reduces friction.
- Human-in-the-loop at every step. No auto-posting, no auto-replying.

## Target Customer
Technical founders who hate writing/marketing. Time-strapped solo founders. Founders who care about signups, not community building. Non-native English speakers. NOT founders who enjoy Reddit and want to build community themselves.

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Database + Auth:** Supabase
- **Styling:** Tailwind CSS + shadcn/ui
- **AI:** Anthropic API (claude-sonnet-4-20250514 for writing, claude-haiku-4-5 for cheap classification tasks)
- **Deployment:** Vercel
- **Payments:** Stripe (not yet — add only when first user asks to pay)

## Reddit Data Access
- NO official Reddit API. Too expensive at MVP scale.
- All Reddit reads/writes go through the founder's own OAuth access token.
- Requests appear as normal user traffic.
- Endpoints used:
  - `reddit.com/search.json` — subreddit discovery
  - `reddit.com/r/[sub]/about/rules.json` — rule fetching
  - `reddit.com/r/[sub]/new.json` — recent posts
  - `reddit.com/api/submit` — posting
- Rate limit all requests aggressively. Space them out. Never hammer endpoints.

## AI Usage Pattern
Use two models to control cost:
- **claude-haiku-4-5:** Cheap tasks — subreddit relevance classification, filtering, basic decisions
- **claude-sonnet-4-20250514:** Quality tasks — drafting posts, drafting comment replies, community fit analysis

## Core Features (in priority order)
1. Founder connects Reddit via OAuth
2. Founder inputs startup description + current update
3. AI discovers relevant subreddits, fetches rules + recent posts, summarizes each
4. Founder reviews community summaries
5. AI drafts platform-native post for each approved community
6. Founder approves / edits / skips each post
7. Post goes live via founder's Reddit account
8. Comment monitoring on posted threads (hourly cron)
9. AI drafts reply suggestions for new comments
10. Founder one-click approves reply

## Platforms
- **Phase 1:** Reddit only
- **Phase 2+:** HackerNews, ProductHunt, Twitter/X (build after first 20 paying users)

## Monetization (not yet — revisit after first 10 users)
- Free trial
- Standard: 15 posts/month, no comment suggestions
- Premium: 45 posts/month + comment reply suggestions
- Pricing: ~$20-30/month for paid tiers

## Build Phases
See `docs/phases/` for detailed specs per phase. Always read the relevant phase file before implementing.

- Phase 0: Next.js skeleton + Vercel deployment
- Phase 1: Supabase auth (email/password)
- Phase 2: Reddit OAuth + token storage
- Phase 3: Startup input form + AI post generation (no posting yet)
- Phase 4: Subreddit discovery + rule fetching + AI community summaries
- Phase 5: Posting to Reddit via founder's token
- Phase 6: Comment monitoring (hourly Vercel cron)
- Phase 7: AI reply suggestions + one-click approve

## Critical Rules
- Complete each phase fully before starting the next. No exceptions.
- Each phase must be deployed and manually verified before moving on.
- Never build UI polish at the expense of core functionality.
- Keep it ugly and working rather than pretty and broken.
- Do not add Stripe, email notifications, or onboarding flows until Phase 7 is done.
- When in doubt, do less. Scope creep kills MVPs.
