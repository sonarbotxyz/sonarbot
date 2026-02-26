# ROADMAP.md — Sonarbot Feature Plan

## What We Have
- ✅ Frontend with Bubbble-style design (Next.js, Tailwind, Framer Motion)
- ✅ Mock data for 12 Base ecosystem projects
- ✅ Pages: Homepage, Project Detail, Upcoming, My Signal, Submit
- ✅ Old `base-signal` codebase with working Supabase API routes (projects CRUD, upvotes, comments, auth, leaderboard, rewards, sponsored slots, subscriptions)

## What We Need to Build

---

### Phase 1: Core Data Layer (Get Real Projects Showing)
**Goal:** Replace mock data with real Supabase-backed projects

1. **Port API routes from base-signal → sonarbot**
   - `/api/projects` — List, create, filter by category, sort (newest/trending/upvotes)
   - `/api/projects/[id]` — Get single project detail
   - `/api/projects/[id]/upvote` — Upvote a project
   - `/api/projects/[id]/comments` — Read/post comments
   - Keep existing Supabase schema and DB — just connect sonarbot to the same Supabase instance

2. **Wire frontend to real API**
   - Homepage fetches from `/api/projects?sort=trending`
   - Project detail page fetches from `/api/projects/[id]`
   - Upvote button calls `/api/projects/[id]/upvote`
   - Category filter passes `?category=defi` etc.

3. **Environment setup**
   - `.env.local` with Supabase URL + service role key
   - Privy app ID for auth

**Estimated effort:** 1 session

---

### Phase 2: Auth + User System
**Goal:** Users can sign in, upvote, and have an identity

1. **Privy authentication**
   - Wallet connect (optional) + email/social login
   - Port Privy setup from base-signal
   - Auth state in React context
   - Protected routes (My Signal, Submit)

2. **User profile**
   - Store user in Supabase (wallet address or email, display name)
   - Track user's upvote history
   - Track user's watched projects

3. **Connect wallet in nav**
   - Small "Connect" button returns to nav (but NOT required to browse)
   - Show wallet address / ENS when connected

**Estimated effort:** 1 session

---

### Phase 3: Watch & Subscribe System (THE KILLER FEATURE)
**Goal:** Users can watch projects and choose what milestones to track

1. **Watch/Unwatch API**
   - `POST /api/projects/[id]/watch` — Add project to user's watchlist
   - `DELETE /api/projects/[id]/watch` — Remove
   - `GET /api/user/watchlist` — Get user's watched projects
   - Supabase table: `watches` (user_id, project_id, created_at)

2. **Alert preferences API**
   - `PUT /api/projects/[id]/alerts` — Set milestone types to track per project
   - Supabase table: `alert_preferences` (user_id, project_id, types: string[])
   - Types: metrics, launches, partnerships, token_events, all_updates

3. **Frontend integration**
   - Watch button on every project card + detail page
   - Alert preferences modal on project detail (checkboxes for milestone types)
   - "My Signal" dashboard shows watched projects + recent alerts
   - Watcher count shown on cards (real count from DB)

**Estimated effort:** 1-2 sessions

---

### Phase 4: Signal Pipeline — Data Collection & Scraping
**Goal:** Automatically gather signals about Base projects from on-chain and social sources

#### Layer 1: On-Chain Metrics (Fully Automated)
Cron jobs poll APIs every 15 minutes. Deterministic, no AI needed.

| Source | What We Track | API | Cost | Cron Frequency |
|--------|--------------|-----|------|----------------|
| **DeFiLlama** | TVL per protocol, TVL change %, yield data | `api.llama.fi/v2/protocols` | Free | Every 15 min |
| **BaseScan** | Contract deployments, tx count, unique wallets | `api.basescan.org` (Etherscan-compatible) | Free (5/sec) | Every 15 min |
| **DexScreener** | Token price, volume, liquidity, pair data | `api.dexscreener.com/latest/dex/tokens` | Free | Every 15 min |
| **Dune Analytics** | Custom queries: DAU, WAU, protocol-specific metrics | `api.dune.com/api/v1/query` | Free tier (100/mo) | Every hour |
| **Alchemy / Base RPC** | Contract events, new deployments, wallet interactions | `base-mainnet.g.alchemy.com` | Free tier | Every 15 min |

**Milestone triggers (automatic):**
```
TVL crosses $100K / $500K / $1M / $5M / $10M → milestone
Unique wallets cross 1K / 5K / 10K / 50K / 100K → milestone
Daily volume crosses $100K / $1M / $10M → milestone
Token price up 50%+ in 24h → signal (trending)
New contract deployed by tracked project → signal
```

**Architecture:**
```
Cron (Vercel Cron or external) 
  → Fetch metrics from APIs
  → Compare against last snapshot in Supabase
  → If threshold crossed → INSERT into signals table
  → Notification engine triggers for watchers
```

**Supabase tables:**
```sql
-- Metric snapshots (time series)
metric_snapshots (
  id, project_id, source, 
  tvl, volume_24h, unique_wallets, tx_count, token_price,
  captured_at
)

-- Tracked thresholds per project
metric_thresholds (
  id, project_id, metric_type, 
  threshold_value, direction, -- 'above' | 'below'
  last_triggered_at
)
```

#### Layer 2: Social Scraping (AI-Assisted)
Agents monitor social channels and classify updates.

| Source | What We Track | API/Method | Cost |
|--------|--------------|------------|------|
| **Twitter/X** | Project account tweets, announcements, partnerships | xurl CLI (we have keys for @0xsonarbot) | Free |
| **Farcaster** | Builder posts, project updates, Base ecosystem chatter | Neynar API (`api.neynar.com`) | Free tier (1K/day) |
| **GitHub** | New releases, major commits, repo activity | `api.github.com` / gh CLI | Free |
| **Medium / Mirror** | Blog posts, launch announcements | RSS feeds + fetch | Free |

**How the agent scraping works:**

1. **Twitter monitoring (every hour)**
   ```
   For each tracked project:
     → xurl GET /2/users/:id/tweets (last hour)
     → Agent classifies each tweet:
       - "new_feature" → signal
       - "partnership" → signal  
       - "milestone_brag" → signal (extract numbers)
       - "general_update" → signal (low priority)
       - "retweet/meme/noise" → skip
     → Classified signals → INSERT into signals table
   ```

2. **Farcaster monitoring (every hour)**
   ```
   Neynar API: search casts by project FID or keywords
     → Same classification pipeline
     → Farcaster-native projects often post here FIRST
   ```

3. **GitHub monitoring (every 6 hours)**
   ```
   For projects with github_url:
     → Check /releases for new versions
     → Check commit frequency (activity score)
     → New release → automatic "update" signal
   ```

**Classification prompt (for AI agent):**
```
Given this tweet from @projectx:
"🚀 Just crossed 10,000 users on Base! Thank you to everyone..."

Classify: 
- Type: metrics_milestone
- Metric: users  
- Value: 10000
- Confidence: high
- Summary: "ProjectX crossed 10,000 users on Base"
```

#### Layer 3: Team Self-Reporting (Manual, Optional)
For things automation can't capture — internal roadmap updates, upcoming plans, context.

1. **Project claiming**
   - Team verifies ownership via Twitter OAuth (tweet from official account) or on-chain signature
   - Claimed projects get a "Verified" badge
   - Team gets a dashboard to post updates

2. **Team update flow**
   - Simple form: title, description, type (feature/milestone/partnership/roadmap)
   - Optional: attach link, image
   - Published immediately to project's signal feed
   - Triggers notifications for watchers

3. **Why teams WILL bother (eventually)**
   - Their project gets more visibility (more watchers = more upvotes)
   - "Verified" badge = trust signal
   - They can see analytics: how many people watching, watcher growth
   - It's their distribution channel to an engaged audience

**Supabase table:**
```sql
-- Team members who claimed a project
project_claims (
  id, project_id, user_id, 
  verification_method, -- 'twitter' | 'onchain' | 'admin'
  verified_at, role -- 'owner' | 'member'
)
```

#### Signal Storage & Processing

**Unified signals table:**
```sql
signals (
  id uuid PRIMARY KEY,
  project_id uuid REFERENCES projects(id),
  
  -- What happened
  type text NOT NULL, -- 'metrics' | 'launch' | 'partnership' | 'token' | 'update' | 'deployment'
  subtype text, -- 'tvl_milestone' | 'user_milestone' | 'new_release' | etc.
  title text NOT NULL,
  description text,
  
  -- Source
  source text NOT NULL, -- 'defillama' | 'basescan' | 'twitter' | 'farcaster' | 'github' | 'team' | 'agent'
  source_url text, -- Link to original tweet/post/tx
  agent_id text, -- Which agent found it (if applicable)
  
  -- Data
  metric_name text, -- 'tvl' | 'users' | 'volume' | etc.
  metric_value numeric, -- The number
  metric_previous numeric, -- Previous value for comparison
  
  -- Status
  confidence text DEFAULT 'high', -- 'high' | 'medium' | 'low'
  is_published boolean DEFAULT true,
  
  -- Timestamps
  detected_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
)

-- Index for fast lookups
CREATE INDEX idx_signals_project ON signals(project_id, created_at DESC);
CREATE INDEX idx_signals_type ON signals(type, created_at DESC);
```

**Notification trigger flow:**
```
New signal inserted into signals table
  → Supabase webhook OR app-level check
  → Query: who is watching this project AND subscribed to this signal type?
  → For each matching user:
    → INSERT into notifications table
    → If user has Telegram linked → send Telegram message
    → If user has email → queue email (daily digest)
```

---

### Phase 5: Telegram Notifications
**Goal:** Users get pinged on Telegram when milestones hit

1. **Telegram bot setup**
   - Create bot via BotFather (or reuse existing @sonarbot)
   - Bot commands: `/start`, `/watch <project>`, `/signal`, `/trending`, `/digest`
   - Link Telegram user to Sonarbot account

2. **Notification engine**
   - Triggered by new signals (see Phase 4 flow)
   - Supabase table: `notifications` (user_id, project_id, signal_id, sent_via, sent_at, read)
   - Notification templates per signal type:
     ```
     📊 Metrics: "ProjectX TVL just crossed $1M (+34% this week)"
     🚀 Launch: "ProjectX released v2.0 — new staking module"
     🤝 Partnership: "ProjectX partnered with Chainlink for price feeds"
     💰 Token: "ProjectX token listed on Aerodrome — $500K initial liquidity"
     ```

3. **Telegram linking flow**
   - On My Signal page: "Connect Telegram" button → opens bot link with deep link token
   - Bot receives `/start <token>` → links Telegram chat_id to user account
   - Supabase table: `telegram_links` (user_id, chat_id, linked_at)

4. **Daily/weekly digest**
   - Cron job: compile top signals from watched projects
   - Send digest via Telegram at configurable time
   - Inline buttons: [View on Sonarbot] [Unwatch]

**Estimated effort:** 2-3 sessions

---

### Phase 6: Submit & Curation
**Goal:** Projects can be submitted by users, teams, or agents

1. **Submit flow**
   - Form: project name, tagline, description, website, Twitter, category, logo upload
   - Image upload to Supabase Storage or Cloudinary
   - Submission goes to "pending" state for review
   - Spam protection: rate limiting, basic validation

2. **Admin/curation**
   - Admin dashboard (protected route)
   - Approve/reject pending submissions
   - Feature projects (set as featured card)
   - Edit project details

3. **Project images**
   - Actual logos/banners replace gradient placeholders
   - OG image generation for sharing

4. **Auto-discovery by agents**
   - Agent monitors BaseScan for new verified contracts
   - Cross-references with Twitter/Farcaster for project info
   - Auto-submits as "pending" for admin review
   - This is how the catalog grows even without manual submissions

**Estimated effort:** 1-2 sessions

---

### Phase 7: Token Integration (Later)
**Goal:** $SNR token mechanics for power users

1. **Boost** — Pay tokens to promote a project higher in rankings
2. **Strong Signal** — Weighted upvote that costs tokens
3. **Early Backer Badge** — Stake tokens on a project you believe in
4. **Submit fee** — Small token cost to submit (spam filter for non-agents)

**Estimated effort:** 2-3 sessions (smart contract interaction)

---

## Data Pipeline Architecture (Overview)

```
┌─────────────────────────────────────────────────────────┐
│                    DATA SOURCES                          │
│                                                         │
│  On-Chain          Social            Manual              │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐        │
│  │DeFiLlama │     │ Twitter  │     │  Team    │        │
│  │BaseScan  │     │Farcaster │     │ Updates  │        │
│  │DexScreen │     │ GitHub   │     │          │        │
│  │  Dune    │     │ Mirror   │     │          │        │
│  │ Alchemy  │     │          │     │          │        │
│  └────┬─────┘     └────┬─────┘     └────┬─────┘        │
│       │                │                │               │
│  Cron: 15min      Agent: 1hr       User action          │
│       │                │                │               │
└───────┼────────────────┼────────────────┼───────────────┘
        │                │                │
        ▼                ▼                ▼
┌─────────────────────────────────────────────────────────┐
│                  SIGNAL PROCESSOR                        │
│                                                         │
│  1. Receive raw data                                    │
│  2. Compare against previous snapshot                   │
│  3. Check threshold triggers                            │
│  4. Classify signal type + confidence                   │
│  5. INSERT into signals table                           │
│  6. Trigger notification engine                         │
│                                                         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                NOTIFICATION ENGINE                       │
│                                                         │
│  1. Query: who watches this project + this signal type? │
│  2. For each matching user:                             │
│     → In-app notification (notifications table)         │
│     → Telegram push (if linked)                         │
│     → Email digest queue (if subscribed)                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Seed Strategy (Day One Content)

Before the pipeline is automated, we seed the platform:

1. **Top 50 Base projects** — Agent scans DeFiLlama's Base protocols list + Base ecosystem page
2. **Pull current metrics** — TVL, user counts, token data for each
3. **Create project profiles** — Name, tagline, category, links, initial metrics
4. **Generate initial signals** — "ProjectX launched on Base" as the first signal for each
5. **Set up metric tracking** — Start capturing snapshots so we can show trends from day one

This gives us a full, real platform on launch — not an empty shell waiting for submissions.

---

## Priority Order (Updated)

| Phase | What | Why | Effort |
|-------|------|-----|--------|
| **1** | Core data layer | Can't do anything without real data | 1 session |
| **2** | Auth + users | Need identity for watch/upvote | 1 session |
| **3** | Watch & subscribe | The differentiator — this IS the product | 1-2 sessions |
| **4** | Signal pipeline | The content engine — metrics + scraping | 2-3 sessions |
| **5** | Telegram notifications | The retention engine | 2-3 sessions |
| **6** | Submit & curation | Growth — let projects self-submit | 1-2 sessions |
| **7** | Token integration | Monetization + power features | 2-3 sessions |

## Suggested Build Order
1. **Phase 1 + 2** — Real data + auth (foundation)
2. **Phase 3** — Watch system (the product)
3. **Phase 4 Layer 1** — On-chain metric tracking (automated content)
4. **Phase 5** — Telegram notifications (retention)
5. **Phase 4 Layer 2** — Social scraping (richer signals)
6. **Phase 6** — Submit + team claiming (growth)
7. **Phase 4 Layer 3** — Team self-reporting (depth)
8. **Phase 7** — Token mechanics (monetization)

---

## Tech Stack (Final)
- **Frontend:** Next.js 16, Tailwind v4, Framer Motion, Lucide icons
- **Auth:** Privy (wallet + email/social)
- **Database:** Supabase (Postgres)
- **Storage:** Supabase Storage (images)
- **Notifications:** Telegram Bot API
- **On-chain data:** DeFiLlama API, BaseScan API, DexScreener API, Alchemy
- **Social scraping:** xurl (Twitter), Neynar (Farcaster), GitHub API
- **AI classification:** Agent service (OpenClaw or standalone)
- **Cron jobs:** Vercel Cron or external scheduler
- **Token:** Viem + Base chain contracts
- **Hosting:** Vercel
- **Domain:** TBD (sonarbot.xyz? basesignal.xyz?)
