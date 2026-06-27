# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**VisibilityRadar** (visibilityradar.ai) — a SaaS that measures how often and how positively AI models (Claude, GPT-4o, Gemini, Perplexity, Grok, DeepSeek) mention a brand, then generates actionable playbooks and SEO-optimized content to improve that visibility.

## Repository Structure

```
AI_insight_v2/
├── backend/          # Python FastAPI — runs on Railway
│   └── main.py       # Entire backend in one file
├── frontend/         # Next.js 16 App Router — deployed on Vercel
│   ├── app/          # Pages + API routes
│   ├── components/   # UI components
│   ├── lib/          # supabase.ts (types + TIER_LIMITS)
│   └── types/        # index.ts (shared TS interfaces)
└── supabase_schema.sql
```

## Development Commands

**Frontend** (from `frontend/`):
```bash
npm run dev      # localhost:3000
npm run build    # production build (run before deploying)
npm run lint     # eslint check
```

**Backend** (from `backend/`):
```bash
uvicorn main:app --reload --port 8000
```

## Architecture

### Data Flow
1. User fills `BrandForm` → `PromptEditor` (step-based flow in `app/page.tsx`)
2. Frontend POSTs to Railway backend `/analyze` with brand, competitors, prompts, tier
3. Backend fans out prompts across all active AI models via **LiteLLM**, counts brand mentions, scores 0-100
4. Results (`AnalyzeResponse`) returned to frontend → rendered by `Dashboard` → `RecommendationsPanel` + `ContentStudioPanel`
5. Pro users can generate a **playbook** (Claude-powered strategy) via `/api/analyses` → stored in Supabase `analyses.playbook` (JSONB)
6. Pro users can generate **5 blog posts** via `/api/content-generations` → stored in `content_plans.posts` (JSONB)

### Backend (`backend/main.py`)
Single-file FastAPI. Key endpoints:
- `POST /analyze` — core analysis: fans out to all active models, returns scores + raw responses
- `POST /generate-prompts` — generates brand-specific test prompts (Claude)
- `POST /suggest-competitors` — suggests competitors (Claude)
- `POST /generate-playbook` — generates per-model strategy playbook (Claude)

**Model activation**: Models are included only if their API key exists in `.env`. The `get_active_models()` function checks at runtime. Free tier uses only the first 2 from `FREE_MODEL_ORDER = ["claude", "gpt4o", "perplexity", "grok", "deepseek"]` (Gemini excluded from free).

**Gemini quirk**: Uses `gemini/gemini-2.5-flash` via LiteLLM. Has a forced system prompt (`GEMINI_SYSTEM`) to prevent generic answers, plus retry logic with 6s/12s backoff for rate limits (free tier: 10 RPM). Still occasionally returns 0 — known issue in ROADMAP.md.

### Frontend Key Files
- **`app/page.tsx`** — Main page with 4-step flow: `form → prompts → email → results`. Handles free demo (cookie-gated, one-time). The free demo shows results with `locked=true`.
- **`lib/supabase.ts`** — Single source of truth for `TIER_LIMITS` (free/pro/agency caps). Update here when changing plan limits.
- **`components/Dashboard.tsx`** — Routes to `PremiumDashboard` or a simplified locked view. Passes `fromHistory` flag when loading past analyses.
- **`components/RecommendationsPanel.tsx`** — Shows per-model strategy playbook. Free users see Claude + GPT-4o with 1 action each (rest blurred). Uses `FREE_PREVIEW_COUNT=2` and `FREE_ACTIONS_LIMIT=1` constants.
- **`components/ContentStudioPanel.tsx`** — AI Content Studio. On mount, fetches existing generated posts from DB and displays them (no need to regenerate). Blocked for free tier; 10/mo for Pro, unlimited for Agency.

### Auth & Routing
- **Clerk** handles auth. `middleware.ts` protects `/analyze`, `/dashboard`, `/profile`, `/admin`.
- Admin panel (`/admin/*`) is hardcoded to `sarefe12@gmail.com` in `app/admin/layout.tsx`.
- `app/api/` routes use `auth()` from `@clerk/nextjs/server` + Supabase `service_role` key (never exposed client-side).

### Database (Supabase)
Key tables: `users`, `analyses`, `content_plans`, `audit_logs`, `token_usage`.
- `analyses.playbook` — JSONB, nullable. Old analyses won't have this field.
- `content_plans.posts` — JSONB array of 5 blog post objects.
- All monetary/limit logic lives in `TIER_LIMITS` in `lib/supabase.ts`, not in the DB.

### Payments
LemonSqueezy (not Stripe despite some legacy references). Webhook at `/api/webhook`. Checkout via `/api/checkout`. Variant IDs in Vercel env vars: `NEXT_PUBLIC_LEMONSQUEEZY_PRO_VARIANT_ID`, `NEXT_PUBLIC_LEMONSQUEEZY_AGENCY_VARIANT_ID`.

### Content Generation
`/api/content-generations` route calls Anthropic API directly (not through Railway backend) using `ANTHROPIC_API_KEY`. Model: `claude-sonnet-4-6`, `max_tokens: 16000`. Expects raw JSON array starting with `[`. Strips markdown code fences before parsing.

## Environment Variables

**Frontend** (Vercel):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- `ANTHROPIC_API_KEY` (for content generation + playbook)
- `NEXT_PUBLIC_LEMONSQUEEZY_PRO_VARIANT_ID`, `NEXT_PUBLIC_LEMONSQUEEZY_AGENCY_VARIANT_ID`, `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_WEBHOOK_SECRET`
- `GA4_PROPERTY_ID`, `GA4_SERVICE_ACCOUNT_JSON` (admin analytics)
- `GOOGLE_SEARCH_CONSOLE_SITE` (admin SEO dashboard)
- `RESEND_API_KEY` (email)

**Backend** (Railway):
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `PERPLEXITY_API_KEY`, `XAI_API_KEY`, `DEEPSEEK_API_KEY`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

## Deployment

- **Frontend**: Vercel, auto-deploy from `main` branch. `frontend/` is the root.
- **Backend**: Railway, auto-deploy from `main` branch. URL: `zealous-perception-production-2d31.up.railway.app`
- The frontend calls the Railway backend directly from client-side for analysis (not via Next.js API route). Backend URL is hardcoded in `components/BrandForm.tsx`.

## Known Issues & Pending Work

See `ROADMAP.md` for the full list. Key ones:
- Gemini can return 0 scores due to Google safety filters avoiding brand comparisons
- LemonSqueezy live mode pending platform review
