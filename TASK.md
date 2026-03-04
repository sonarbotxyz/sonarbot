# TASK: Phase 3 — Watch & Subscribe System

## Overview
Build the Watch & Subscribe system. This is the core product feature. Users must be signed in to watch.

## 1. Supabase Migration

Create `supabase/migrations/002_watch_subscribe.sql`:

### Tables to create:

**watches** — user watches a project
- id UUID PK default gen_random_uuid()
- user_id UUID NOT NULL references users(id) on delete cascade
- project_id UUID NOT NULL references projects(id) on delete cascade
- created_at TIMESTAMPTZ default now()
- UNIQUE(user_id, project_id)
- Index on user_id, index on project_id

**alert_preferences** — per-project per-user alert settings (5 checkboxes)
- id UUID PK default gen_random_uuid()
- user_id UUID NOT NULL references users(id) on delete cascade
- project_id UUID NOT NULL references projects(id) on delete cascade
- metrics_milestones BOOLEAN default true
- new_features_launches BOOLEAN default true
- partnerships_integrations BOOLEAN default false
- all_updates BOOLEAN default false
- token_events BOOLEAN default false
- updated_at TIMESTAMPTZ default now()
- UNIQUE(user_id, project_id)

**signals** — unified signal storage
- id UUID PK default gen_random_uuid()
- project_id UUID NOT NULL references projects(id) on delete cascade
- type TEXT NOT NULL check (type in ('metrics_milestones','new_features_launches','partnerships_integrations','all_updates','token_events'))
- title TEXT NOT NULL
- description TEXT
- source TEXT NOT NULL
- source_url TEXT
- metric_name TEXT
- metric_value NUMERIC
- metric_previous NUMERIC
- confidence TEXT default 'high'
- is_published BOOLEAN default true
- detected_at TIMESTAMPTZ default now()
- created_at TIMESTAMPTZ default now()
- Index on (project_id, created_at DESC), index on (type, created_at DESC)

**notifications** — per-user notifications
- id UUID PK default gen_random_uuid()
- user_id UUID NOT NULL references users(id) on delete cascade
- signal_id UUID references signals(id) on delete cascade
- project_id UUID NOT NULL references projects(id) on delete cascade
- sent_via TEXT default 'in_app'
- read BOOLEAN default false
- created_at TIMESTAMPTZ default now()
- Index on (user_id, created_at DESC)

**telegram_links** — link telegram chat to user account
- id UUID PK default gen_random_uuid()
- user_id UUID NOT NULL references users(id) on delete cascade
- chat_id TEXT NOT NULL UNIQUE
- linked_at TIMESTAMPTZ default now()

**Trigger:** Auto-update projects.watchers count on watch insert/delete using a plpgsql function.

## 2. API Routes

### POST /api/projects/[id]/watch
- Auth required (use authenticateRequest from src/lib/auth.ts)
- Upsert user in users table by privy_id if they dont exist yet
- Create watch record
- Create default alert_preferences (metrics_milestones=true, new_features_launches=true, rest false)
- Return { watched: true, preferences: {...} }

### DELETE /api/projects/[id]/watch
- Auth required
- Remove watch + alert_preferences for this user+project
- Return { watched: false }

### GET /api/projects/[id]/watch
- Auth required
- Check if current user watches this project
- Return { watched: boolean, preferences: {...} | null }

### PUT /api/projects/[id]/alerts
- Auth required
- Body: { metrics_milestones, new_features_launches, partnerships_integrations, all_updates, token_events } (all booleans)
- Upsert alert_preferences
- Return updated preferences

### GET /api/user/watchlist
- Auth required
- Return array of watched projects with alert preferences and recent signals
- Join watches + projects + alert_preferences + latest 5 signals per project

### GET /api/user/signals
- Auth required
- Return signal feed: signals from watched projects filtered by user alert preferences
- Paginated with limit/offset query params

## 3. Wire Frontend

### Watch button on ProjectCard and ProjectDetail
- Currently may be mock. Wire to POST/DELETE /api/projects/[id]/watch
- Show filled/unfilled state based on GET /api/projects/[id]/watch
- Require auth — if not signed in, prompt to sign in

### Signal preferences modal
- The modal UI with 5 checkboxes already exists in the codebase
- Wire Save Preferences button to PUT /api/projects/[id]/alerts
- Load saved preferences when modal opens via GET /api/projects/[id]/watch

### My Signal page (/my-signal)
- Replace ALL mock data with real API calls
- Fetch from /api/user/watchlist for watched projects
- Fetch from /api/user/signals for the signal feed
- Show empty state if not signed in or no watches
- Remove mock-data imports from this page

### Homepage
- Show real watcher count from projects.watchers column (already fetched by API)

## 4. Important Rules
- DO NOT change any styling or design. Keep the terminal aesthetic exactly as-is.
- The 5 alert categories match the existing modal: metrics_milestones, new_features_launches, partnerships_integrations, all_updates, token_events
- All API responses use snake_case
- Frontend maps to camelCase via existing mappers in src/lib/types.ts
- Use the existing authenticateRequest() from src/lib/auth.ts for all protected endpoints
- Create user record on first watch if it doesnt exist (upsert by privy_id)
- Run `npm run build` before finishing to verify everything compiles
- Commit your work with clear messages

When completely finished, run: openclaw system event --text "Done: Phase 3 Watch and Subscribe system" --mode now
