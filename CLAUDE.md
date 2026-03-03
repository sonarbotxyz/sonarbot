# CLAUDE.md — Sonarbot (Base Signal v3)

## What This Is
Sonarbot — a premium crypto discovery platform for the Base ecosystem. Users discover projects, watch the ones they care about, and get Telegram notifications when milestones happen.

## Stack
- Next.js (App Router) + React + TypeScript
- Tailwind CSS v4
- Framer Motion for animations
- Lucide React for ALL icons (NO emoji in UI ever)

## CURRENT TASK: Full UI Redesign — Terminal/Editorial Aesthetic

We're redesigning Sonarbot to match the clean minimalist terminal look of Base Playbook (baseplaybook.xyz). Reference code is in `/reference/base-playbook/` — study it closely.

### Design System to Implement

**Typography:**
- JetBrains Mono as body/default font (`font-mono`)
- Space Grotesk for headings only (`font-display`)
- Uppercase tracking everywhere for labels, nav, section headers
- `letter-spacing: 0.04em–0.2em` on small text

**Colors (CSS Variables, light/dark support):**
```
Dark:
  --bg-primary: #0A0A0A
  --bg-secondary: #111111
  --bg-tertiary: #1A1A1A
  --text-primary: #F5F5F5
  --text-body: #CCCCCC
  --text-secondary: #888888
  --text-muted: #666666
  --text-very-muted: #444444
  --border: rgba(255,255,255,0.08)
  --border-strong: rgba(255,255,255,0.14)
  --accent: #1652F0
  --accent-dim: rgba(22,82,240,0.15)
  --accent-glow: rgba(22,82,240,0.08)
  --card-bg: #111111
  --card-hover: #1A1A1A
  --nav-bg: rgba(10,10,10,0.85)
Light:
  --bg-primary: #FFFFFF
  --bg-secondary: #F5F5F5
  --text-primary: #0A0A0A
  --text-body: #444444
  --text-secondary: #555555
  --border: rgba(0,0,0,0.08)
  --accent: #1652F0
  --nav-bg: rgba(255,255,255,0.85)
```

**Layout Elements:**
- Fixed vertical line rails at 48px from left/right edges (with dot endpoints)
- Horizontal rules with `data-label` text positioned at right edge
- Content max-width with generous `px-5 md:px-20` padding
- Sharp edges everywhere — NO rounded-2xl, NO border-radius on cards
- 1px border-separated grids instead of floating cards with gaps

**Components to Match:**
- Header: fixed, glass blur, uppercase nav links, theme toggle (sun/moon SVG)
- Section headers: `> Label` prefix with accent-colored `>`, uppercase tracking
- Project cards: numbered (`001`, `002`), category tag with accent border, clean metadata row
- Project list rows: numbered, grid layout `[60px_1fr_auto]`, hover accent line reveal
- Category sections: sticky left label + guide rows on right (like baseplaybook topic sections)
- CTA boxes: corner bracket decorations (CSS pseudo-elements)
- Footer: minimal, text links, same terminal feel

**Interactions:**
- `.guide-card::before` — accent line scaleX(0) → scaleX(1) on hover
- `.theme-guide-row:hover` — gradient reveal + badge color shift
- Smooth transitions: `cubic-bezier(0.16, 1, 0.3, 1)`
- Subtle fadeUp animations on scroll

**What to Kill:**
- All glassmorphism (`.glass` class)
- All `rounded-2xl` on cards
- Category-specific color gradients on banners
- Floating card shadows
- The current teal `#3DD7D8` primary — replace with Base blue `#1652F0`

**What to Keep:**
- All data layer (Supabase, API routes, mappers, mock data)
- Auth system (Privy + AuthContext)
- Health scores, sparklines, whale data
- All page routes and their functionality
- Framer Motion (but simpler, editorial animations)

## USE THE frontend-design PLUGIN
Use the frontend-design MCP tool for visual component inspiration and patterns. This is critical for achieving premium visual quality.

## Build Commands
- `npm run dev` — Development server
- `npm run build` — Production build (MUST pass before done)
- `npm run lint` — Linting

## Pages
1. Homepage — hero + featured + category grid + project cards
2. Project Detail (/project/[id]) — stats, milestones, comments
3. Upcoming (/upcoming) — countdown timers, notify buttons
4. My Signal (/my-signal) — watched projects, alert feed
5. Submit (/submit) — project submission form
