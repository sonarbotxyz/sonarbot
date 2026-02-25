# CLAUDE.md — Sonarbot (Base Signal v3)

## What This Is
Sonarbot — a premium crypto discovery platform for the Base ecosystem. Users discover projects, watch the ones they care about, and get Telegram notifications when milestones happen.

## Stack
- Next.js (App Router) + React + TypeScript
- Tailwind CSS v4
- Framer Motion for animations
- Lucide React for ALL icons (NO emoji in UI ever)
- shadcn/ui as component base (heavily restyled)

## Design Reference
Read DESIGN.md for the full brief. This is a Bubbble-level visual product.

### Key Design Principles
- **Dark mode only**. Background #0A0A0F, card surfaces #1A1A2E, no borders — depth through surface color contrast
- **Visual card grid** like Bubbble: 4 cols desktop, 3 tablet, 2 mobile, 1 small mobile
- **Cards are 65% visual banner, 35% content** — content-forward, images dominate
- **Category-specific gradients** on banners: DeFi=blue, Social=purple, NFT=pink, Infra=green, Gaming=orange, Tools=gray
- **Hover effects**: translateY(-4px) + category-colored glow shadow + slight scale
- **No emoji anywhere** — Lucide React icons only (Eye, ChevronUp, Flame, Bell, Search, Menu, X, Radio, ExternalLink, etc.)
- **Mobile-first** — every component must work 375px to 1440px+
- **Min 44px touch targets** on all interactive elements
- **Typography**: Space Grotesk for brand, Inter for body, JetBrains Mono for numbers
- **Primary accent**: Base blue #0052FF, used sparingly

### What NOT To Do
- No emoji unicode in UI components
- No gradient blob hero sections  
- No "trusted by" logo bars
- No light mode
- No mandatory wallet connection
- No generic SaaS layouts
- No stock illustrations

## Pages to Build

### 1. Homepage
- Minimal hero: "Discover what's building on Base" + search bar
- Featured project (full-width or 2-col span card with richer content)
- Category filter pills (horizontal scroll on mobile)
- Project card grid (3-4 cols desktop, responsive down)
- Desktop sidebar: Launching Soon preview, ecosystem stats
- Footer

### 2. Project Detail (/project/[id])
- Large gradient banner with project info
- Stats, milestones timeline, watch/subscribe CTA
- Alert subscription modal (pick milestone types)
- Comments/discussion section

### 3. Upcoming (/upcoming)
- Visual card grid with countdown timers
- "Notify Me" buttons with Bell icon

### 4. My Signal (/my-signal)  
- Personal dashboard: watched projects grid + alert feed
- Notification preferences with toggle switches

### 5. Submit (/submit)
- Project submission form

## Build Commands
- `npm run dev` — Development server
- `npm run build` — Production build (MUST pass before done)
- `npm run lint` — Linting

## USE THE frontend-design PLUGIN
Use the frontend-design MCP tool for visual component inspiration and patterns. This is critical for achieving premium visual quality.
