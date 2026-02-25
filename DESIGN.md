# DESIGN.md — Base Signal v2: Full Redesign Brief

## What Base Signal Is

**A personalized intelligence feed for the Base ecosystem.**

Not a daily launch leaderboard. Not a crypto Product Hunt clone. A platform where you:
1. Discover projects building on Base
2. Watch the ones you care about
3. Get notified via Telegram when milestones you chose actually happen
4. Build your own signal dashboard — your personal Base radar

The AI agents curate and surface signals. The users decide what matters to them.

---

## The Three Pillars

### 1. Discovery (The Browse)
The public feed. New projects, trending projects, ecosystem signals. This is what gets people IN the door.

### 2. Watchlist + Alerts (The Hook)
Subscribe to projects. Pick your milestones. Get Telegram pings. This is what makes people COME BACK.

### 3. Personal Dashboard (The Home)
Your watched projects, your alerts, your activity feed. This is what makes people STAY.

---

## Why This Works (Product Reasoning)

### Cold Start Solved
- Don't need 20 daily launches. Even 10 projects with regular milestone updates = steady signal flow.
- AI agents generate signals from on-chain data, social activity, contract deployments — content is automated.
- The value isn't "new launches today" — it's "what happened with the projects I'm watching."

### Token Friction Removed
- **Free**: Browse, upvote, watch projects, get Telegram notifications, build dashboard
- **Token-enhanced**: Boost projects (paid promotion), submit projects (spam filter), "strong signal" weighted votes, early backer badges
- Someone can use Base Signal for weeks without ever connecting a wallet. Tokens are power-user tools, not entry requirements.

### Retention Loop
1. **Trigger**: Telegram notification — "🚀 ProjectX just hit 10K users — a milestone you're tracking"
2. **Action**: Tap notification → lands on project page on Base Signal
3. **Reward**: Fresh intel + discovery of related projects → watch more → more future notifications
4. **Loop strengthens**: More watches = more notifications = more reasons to come back

---

## Information Architecture

```
Base Signal
├── 🏠 Home / Feed (public discovery)
│   ├── Trending (most upvoted recently)
│   ├── New (latest additions)
│   ├── Categories (DeFi, NFT, Gaming, Infra, Social, Tools)
│   └── Upcoming (pre-launch with countdowns)
│
├── 📡 My Signal (personal dashboard — requires login)
│   ├── Watched Projects (card grid of subscribed projects)
│   ├── Alert Feed (timeline of triggered milestones)
│   ├── Notification Settings (per-project milestone toggles)
│   └── Weekly Recap (summary of all watched project activity)
│
├── 📄 Project Page (individual project detail)
│   ├── Banner + description + links
│   ├── Milestones timeline (achieved + upcoming)
│   ├── Stats (watchers, upvotes, on-chain metrics)
│   ├── Updates feed (from agents or team)
│   └── Discussion / comments
│
├── 🚀 Submit (add a project)
│
└── 👤 Profile
    ├── Watched projects
    ├── Upvote history
    ├── Badges & streaks
    └── Token balance (if connected)
```

---

## The Feed: Layout & Structure

### Main Feed (Home)

**List layout** for scannability. Not a grid. Each item is a horizontal row:

```
┌──────────────────────────────────────────────────────────────┐
│  🔵 Base Signal      [Search...]   [📡 My Signal] [Connect] │
├──────────────────────────────────────────────────────────────┤
│  [Trending]  [New]  [Upcoming]  [DeFi ▾]                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────┐  ProjectName                              ▲ 284     │
│  │logo│  One-line description of what they build   🔥 Hot   │
│  └────┘  🏷️ DeFi · DEX    👀 847 watching                   │
│                                                    [Watch]   │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                                              │
│  ┌────┐  AnotherProject                           ▲ 156     │
│  │logo│  Short description of the project                    │
│  └────┘  🏷️ NFT · Marketplace  👀 423 watching              │
│                                                    [Watch]   │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                                              │
│  ┌────┐  ThirdProject                             ▲ 98      │
│  │logo│  Description of what this does                       │
│  └────┘  🏷️ Infra · Bridge   👀 201 watching                │
│                                                    [Watch]   │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  SIDEBAR (desktop)                                           │
│  ┌──────────────────────┐                                    │
│  │ 🚀 Launching Soon     │                                   │
│  │                       │                                   │
│  │ ProjectA     in 2d    │                                   │
│  │ 👀 342 · [🔔 Notify] │                                   │
│  │                       │                                   │
│  │ ProjectB     in 5d    │                                   │
│  │ 👀 128 · [🔔 Notify] │                                   │
│  ├───────────────────────┤                                   │
│  │ 📊 Base Ecosystem     │                                   │
│  │ Total Projects: 147   │                                   │
│  │ This Week: +12        │                                   │
│  │ Total Watchers: 4.2K  │                                   │
│  └───────────────────────┘                                   │
└──────────────────────────────────────────────────────────────┘
```

**Key details:**
- 👀 Watcher count on every project (social proof + FOMO)
- [Watch] button is the primary CTA — not upvote
- Upvote is secondary (the arrow ▲)
- "🔥 Hot" badge for trending velocity (lots of upvotes in short time)
- Sidebar shows upcoming launches with notify button

### My Signal Dashboard (Personal)

This is where the magic lives. After login:

```
┌──────────────────────────────────────────────────────────────┐
│  📡 My Signal                          Last updated: 2m ago  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  🔔 RECENT ALERTS                                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 🟢 ProjectX hit 10,000 users              2 hours ago │  │
│  │    You're tracking: User milestones                    │  │
│  │    [View Project →]                                    │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ 🟢 ProjectY launched v2.0                 5 hours ago  │  │
│  │    You're tracking: Feature launches                   │  │
│  │    [View Project →]                                    │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ 🟢 ProjectZ TVL crossed $500K            yesterday     │  │
│  │    You're tracking: TVL milestones                     │  │
│  │    [View Project →]                                    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  👀 WATCHING (8 projects)                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ [banner] │ │ [banner] │ │ [banner] │ │ [banner] │       │
│  │ ProjA    │ │ ProjB    │ │ ProjC    │ │ ProjD    │       │
│  │ 🟢 2 new │ │ quiet    │ │ 🟢 1 new │ │ 🔥 hot   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ [banner] │ │ [banner] │ │ [banner] │ │ [banner] │       │
│  │ ProjE    │ │ ProjF    │ │ ProjG    │ │ ProjH    │       │
│  │ quiet    │ │ 🟢 3 new │ │ quiet    │ │ launching│       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Key details:**
- Alert feed at top — reverse chronological timeline of milestone triggers
- Watched projects as card grid below — visual, shows activity status
- 🟢 dot = new activity since last visit
- Cards are clickable → go to project page
- Grid works here because it's YOUR curated set, not a ranked list

---

## Project Page: Milestone Subscriptions

When you hit "Watch" on a project, you choose what to track:

```
┌──────────────────────────────────────────────────────────────┐
│  🔔 CHOOSE YOUR SIGNALS FOR: ProjectX                       │
│                                                              │
│  What do you want to be notified about?                      │
│                                                              │
│  [✅] 📊 Metrics milestones                                  │
│       Users, TVL, volume crossing key thresholds             │
│                                                              │
│  [✅] 🚀 New features & launches                             │
│       Product updates, new versions, feature drops           │
│                                                              │
│  [ ] 🤝 Partnerships & integrations                          │
│       New partners, chain expansions, protocol integrations  │
│                                                              │
│  [ ] 📰 All updates                                          │
│       Everything the agents find about this project          │
│                                                              │
│  [ ] 💰 Token events (if applicable)                         │
│       Listings, liquidity events, tokenomics changes         │
│                                                              │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                                              │
│  Notify me via:                                              │
│  [✅] Telegram    [ ] Email    [✅] In-app                    │
│                                                              │
│  [Save Preferences]                                          │
└──────────────────────────────────────────────────────────────┘
```

---

## Telegram Integration

### Notification Examples

```
📡 Base Signal Alert

🟢 ProjectX just hit 10,000 users!
You're tracking: Metrics milestones
⬆️ 284 upvotes · 👀 847 watching

→ View on Base Signal: basesignal.xyz/project/projectx
```

```
📡 Base Signal — Weekly Recap

Your watched projects this week:

🔥 ProjectX — 10K users milestone, launched staking
📈 ProjectY — TVL up 340% to $2.1M
🚀 ProjectZ — Launched on mainnet
😴 ProjectA, ProjectB — No major updates

→ Full recap: basesignal.xyz/my-signal
```

### Telegram Bot Features
- `/watch <project>` — Watch a project directly from Telegram
- `/signal` — Show your current alert feed
- `/trending` — Today's top 5 on Base Signal
- `/upcoming` — What's launching soon
- Inline buttons on every notification: [View] [Unwatch] [Share]

---

## Visual Design Direction

### Color Palette

| Role | Color | Hex |
|------|-------|-----|
| Background | Near-black | #0C0C0E |
| Surface | Dark gray | #16161A |
| Surface hover | Lighter gray | #1E1E24 |
| Border | Subtle | #2A2A32 |
| Primary | Base Blue | #0052FF |
| Success | Neon Green | #00D897 |
| Danger | Soft Red | #FF4466 |
| Gold (tokens) | Amber | #FFB800 |
| Text Primary | Off-white | #F5F5F5 |
| Text Secondary | Muted | #8B8B9A |
| Text Tertiary | Dark | #56566B |

### Typography
- **Brand/Logo**: Space Grotesk Bold
- **Headings**: Inter Semibold
- **Body**: Inter Regular (14-16px)
- **Numbers/Metrics**: JetBrains Mono Medium
- **Tags/Labels**: Inter Medium 12px, uppercase

### Key Visual Elements
- Watch count (👀) as prominent social proof on every card
- Green dot indicators for new activity
- Subtle glow on cards with high recent activity
- Base blue (#0052FF) as the signature accent — used sparingly
- Category pills with muted backgrounds
- Clean dividers between list items (no heavy borders)

### Motion
- Upvote button: quick bounce + count increment animation
- Watch button: pulse animation on subscribe
- Notification bell: subtle shake when new alerts
- Cards: gentle hover lift (2px translate-y + shadow)
- Page transitions: crossfade
- Number counters: smooth count-up on load

### Crypto Codes (Subtle, Not Cosplay)
- Dark mode only
- Monospace for all numbers
- Green/red for directional metrics
- Wallet connect in nav (but not required)
- Token balance shown when connected (but not if not)
- "👀 watching" language over "followers" — feels more crypto
- "Signal" language over "notification" — on brand

---

## Anti-Patterns
- ❌ No gradient blob hero sections
- ❌ No "trusted by" logo bars
- ❌ No generic SaaS feature grids
- ❌ No light mode
- ❌ No stock illustrations
- ❌ No "AI-powered" marketing speak
- ❌ No mandatory wallet connection to browse
- ❌ No token cost for basic actions
- ❌ No empty states that look dead (always show something)

---

## Pages & Priority

### P0 — MVP
1. **Homepage Feed** — List layout, trending/new/categories, search
2. **Project Page** — Detail view with milestones, stats, watch button
3. **Watch + Alert Preferences** — Choose milestones per project
4. **Telegram Bot** — Notifications, alerts, weekly digest
5. **Auth** — Privy (wallet optional, email/social login OK)

### P1 — Post-Launch
6. **My Signal Dashboard** — Personal watched projects + alert feed
7. **Upcoming Section** — Pre-launch projects with countdowns + notify
8. **Submit Project** — Project submission flow
9. **Categories & Search** — Filtered browsing
10. **Weekly Recap** — Automated email/Telegram digest

### P2 — Growth
11. **Token Integration** — Boost, strong signal, badges
12. **Agent Profiles** — See which agents have the best signal track record
13. **Collections** — Curated lists ("Top DEXs", "Rising Stars")
14. **API** — For builders and integrations
15. **Streaks & Gamification** — Daily visit rewards, discovery badges

---

## Key Differentiators

| Others | Base Signal |
|---|---|
| Browse and leave | Watch + get notified. We come to YOU. |
| Same feed for everyone | Personal dashboard tailored to what you watch |
| Generic crypto aggregator | Base ecosystem specific — deep, not wide |
| Need to check daily | Telegram brings the signal to you |
| Passive discovery | Active subscription — you choose your milestones |
| Token-gated everything | Free to use, tokens for power features |
| AI replaces humans | AI agents curate, humans decide what matters |
