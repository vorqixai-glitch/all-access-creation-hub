# The Everything AI Platform — Architecture Plan

Building a "unified AI hub + no-code builder + agent workspace + marketplace" is a multi-quarter effort. To ship without collapsing under scope, we build in **5 phases**, each usable on its own.

## Tech Foundation

- **Frontend**: TanStack Start (already set up), React 19, Tailwind v4, shadcn/ui
- **Backend**: Lovable Cloud (Postgres + Auth + Storage + Server Functions)
- **AI**: Lovable AI Gateway (all major models: GPT, Claude, Gemini, Llama, etc.) via AI SDK
- **Auth**: Email/password + Google (multi-user, RLS-scoped per user, roles table for admin/creator/user)
- **Payments**: Stripe (subscriptions + marketplace payouts) — later phase

## Phase 1 — Foundation & Unified Chat (MVP)

The core everyone touches first.

- Auth (email + Google), profile, roles table (`user`, `creator`, `admin`)
- Threaded chat with persistent history (per-user, DB-backed)
- **Model switcher** in composer: pick GPT-5, Claude Sonnet, Gemini 3 Pro, etc. per message
- Streaming responses, markdown rendering, code blocks, message parts
- File/image attachments → sent to vision-capable models
- Image generation tool built-in (Gemini image, Flux)
- Web search tool built-in
- Usage tracking per user (tokens, cost)

## Phase 2 — Skills, Tools & Connectors

Let users extend what the AI can do.

- **Connectors panel**: OAuth flows for Gmail, Google Drive, Slack, Notion, Linear, GitHub, Calendar, etc. — tokens stored encrypted per user
- **Skills library**: reusable prompt+tool bundles (e.g. "Email triage", "Meeting summarizer")
- **Custom tools**: users define tools via JSON schema; agent calls them via HTTP webhook
- **MCP client**: connect any remote MCP server (paste URL, OAuth flow) — instantly adds those tools to the agent
- Per-thread tool toggle (which tools/connectors are active)

## Phase 3 — Agents & Workflows

Compose behavior, not just chat.

- **Agent Builder**: name, system prompt, model, allowed tools, memory settings, knowledge base (RAG)
- **Knowledge bases**: upload docs → embed → semantic search tool auto-added
- **Workflows**: visual node editor (trigger → agent step → tool → branch → output). Cron + webhook triggers
- **Scheduled runs** and background execution
- Agent sharing (private / workspace / public)

## Phase 4 — App Builder

The Emergent/Lovable-style layer.

- "Describe an app" → agent scaffolds a mini-app (form + logic + data table) inside the platform
- Built apps run in sandboxed iframes, use platform auth + DB
- Templates gallery

## Phase 5 — Marketplace & Monetization

- Publish agents, skills, workflows, apps → discover/install
- Ratings, categories, search
- Creator payouts via Stripe Connect
- Subscription tiers (Free / Pro / Team) with credit allowances
- Team workspaces, shared connectors, role-based access

---

## Data Model (Phase 1 tables)

```text
profiles (id → auth.users, display_name, avatar, plan)
user_roles (user_id, role: 'admin'|'creator'|'user')
threads (id, user_id, title, model, system_prompt, created_at)
messages (id, thread_id, role, parts jsonb, model, tokens, created_at)
usage_events (user_id, model, prompt_tokens, completion_tokens, cost, created_at)
```

All tables: RLS scoped to `auth.uid()`, GRANTs to `authenticated`.

## Routes (Phase 1)

```text
/                       marketing landing
/auth                   sign in / sign up
/chat                   redirect to latest or new thread
/chat/$threadId         active conversation (dedicated URL per thread)
/settings/account
/settings/usage
/_authenticated/*       gated subtree
```

## What ships this turn (if you approve)

**Phase 1 only.** That gives you a working multi-user chat platform with every major AI model, thread history, image gen, and web search — the foundation everything else plugs into. Phases 2–5 come as separate approved plans so each ships polished, not half-done.

## Open decisions before I build Phase 1

1. **Landing page style** — should I generate 3 design directions, or go straight to a clean default (dark, modern, dev-tool aesthetic like Linear/Vercel)?
2. **Free tier limits** — daily message cap per free user? (suggest: 30 msgs/day, upgrade to remove)
3. **Default model** — which model should new threads use out of the box? (suggest: Gemini 3 Pro — fast, cheap, multimodal, tool-capable)

Answer those three inline and I'll start building.
