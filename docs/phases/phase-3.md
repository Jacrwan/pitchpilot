# Phase 3 — Startup Input + AI Post Generation

## Goal
Founder describes their startup and current update. AI generates a Reddit post draft. No posting yet — just text in, text out.

## Deliverables
- Form on dashboard: "Startup description" + "Current update"
- On submit → call Anthropic API → display generated post
- Post draft displayed with edit capability
- No subreddit matching yet. No actual posting yet.

## Steps
1. Install Anthropic SDK: `npm install @anthropic-ai/sdk`
2. Add `ANTHROPIC_API_KEY` to `.env.local` and Vercel
3. Build form component with two fields: startup description + current update
4. Build `/api/generate-post` route:
   - Takes startup description + update
   - Calls claude-sonnet-4-20250514
   - Returns generated post (title + body)
5. Display generated post below form
6. Make post body editable (textarea)

## Anthropic Prompt (use this exactly)
```
You are helping a startup founder write an authentic Reddit post to share their product update.

Startup: {startupDescription}
Current update: {currentUpdate}

Write a Reddit post that:
- Sounds like a real founder wrote it, not a marketer
- Is conversational and honest
- Leads with the story/journey, not the product pitch
- Ends with a soft call to action or question to spark discussion
- Has a title and a body

Format:
Title: [title here]
Body: [body here]
```

## Done When
- Fill in form → click generate → see post draft appear
- Post has a title and body
- Body is editable
- No console errors
