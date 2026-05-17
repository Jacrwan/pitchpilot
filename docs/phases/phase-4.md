# Phase 4 — Subreddit Discovery + Community Summaries

## Goal
AI finds relevant subreddits for the startup, fetches their rules and recent posts, and shows the founder a summary of each community before drafting posts.

## Deliverables
- AI suggests 5 candidate subreddits based on startup description
- For each subreddit, fetch rules + recent posts using founder's Reddit token
- AI summarizes each subreddit: posting rules, tone, self-promo policy
- Founder sees list of communities with summaries
- Founder can approve or skip each community

## Steps
1. Build `/api/discover-subreddits` route:
   - Input: startup description
   - Use claude-haiku-4-5 to suggest 5 relevant subreddit names
   - Return list of subreddit names

2. Build `/api/analyze-subreddit` route:
   - Input: subreddit name + founder's Reddit token
   - Fetch `reddit.com/r/{sub}/about/rules.json` using token
   - Fetch `reddit.com/r/{sub}/new.json?limit=10` using token
   - Feed both to claude-haiku-4-5
   - Return summary: { allowsSelfPromo: boolean, tone: string, tips: string }

3. Display subreddit cards on dashboard:
   - Subreddit name
   - AI summary
   - "Use this community" / "Skip" buttons

4. Store approved communities in state for Phase 5

## Subreddit Discovery Prompt
```
Given this startup, suggest 5 relevant subreddit names where the founder could authentically share their product.

Startup: {startupDescription}

Rules:
- Only suggest subreddits that are known to allow founder/product posts
- Prefer communities with active founders (r/SaaS, r/indiehackers, r/entrepreneur, r/startups, r/sideproject)
- Return only subreddit names, one per line, no r/ prefix
```

## Community Analysis Prompt
```
Analyze this subreddit for a founder who wants to post about their startup.

Rules page: {rules}
Recent posts sample: {recentPosts}

Return a short summary covering:
1. Does this subreddit allow self-promotion? (yes/no/conditional)
2. What tone do posts use here? (technical, casual, storytelling, etc.)
3. One tip for posting successfully in this community

Keep it under 4 sentences total.
```

## Done When
- Generate subreddits → 5 cards appear with summaries
- Each card shows self-promo policy + tone + tip
- Can approve or skip each community
- No console errors
