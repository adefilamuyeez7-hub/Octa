# OCTA Hub

OCTA Hub is a Vite-based React HR workflow dashboard with admin onboarding, Notion sync, wallet payments, and a JSON-backed local database.

## Key features

- Admin onboarding checklist for first-time setup
- Notion connect UI and sync flow
- AI agent dashboard for task and review automation
- Wallet connect / token purchase simulation
- Local JSON persistence fallback for users, tasks, and settings
- Simple routing with `@tanstack/react-router`

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open the app in the browser and visit `/dashboard`.

## Notion integration

This app uses a server-side route to start Notion OAuth.

Set these environment variables before running the app:

- `NOTION_CLIENT_ID`
- `NOTION_CLIENT_SECRET`
- `NOTION_REDIRECT_URI`
- `NOTION_DATABASE_ID`
- `NOTION_TOKEN` (optional alternative to OAuth cookie auth)

Example:

```bash
set NOTION_CLIENT_ID=your-client-id
set NOTION_CLIENT_SECRET=your-client-secret
set NOTION_REDIRECT_URI=http://localhost:3000
set NOTION_DATABASE_ID=your-database-id
```

Then use the `Connect Notion` button in the dashboard.

## Live agent mode

The dashboard agent now posts to a server endpoint at `/api/agent/run`.

To connect that endpoint to Moltbot, set:

- `MOLTBOT_WEBHOOK_URL`
- `MOLTBOT_API_KEY` (optional)
- `MOLTBOT_AGENT_ID` (optional, defaults to `main`)

For an OpenClaw/Moltbot Gateway, `MOLTBOT_WEBHOOK_URL` should usually be your Gateway OpenResponses endpoint, for example:

```bash
http://127.0.0.1:18789/v1/responses
```

The server sends a JSON payload like:

```json
{
  "model": "openclaw",
  "input": "Run payroll for August with bonuses",
  "user": "octa-dashboard",
  "message": "Run payroll for August with bonuses",
  "history": [
    { "from": "agent", "text": "..." },
    { "from": "you", "text": "..." }
  ],
  "source": "octa-dashboard"
}
```

If `MOLTBOT_WEBHOOK_URL` is not set, the app falls back to a local reply.

## Vercel deployment

This repo now deploys as a Vite SPA plus Vercel Functions in the root `api/` directory.

Set these Vercel environment variables as needed:

- `NOTION_CLIENT_ID`
- `NOTION_CLIENT_SECRET`
- `NOTION_REDIRECT_URI`
- `NOTION_DATABASE_ID`
- `NOTION_TOKEN`
- `MOLTBOT_WEBHOOK_URL`
- `MOLTBOT_API_KEY`
- `MOLTBOT_AGENT_ID`

## Admin onboarding

The dashboard now contains an `Admin onboarding` section with:

- workspace setup
- Notion connection
- token policy configuration
- wallet enablement
- admin invite checklist

## Wallet and tokens

The landing page includes wallet connect support and a token purchase simulation. Use `/buy` to top up simulated `$OCTA` metrics.

## Notes

- `bun.lock` has been removed to clear leftover `lovable` dependencies.
- The app is built to run with standard Node/npm tooling.
- The local persistence layer now sits behind a typed repository in `src/lib/storage/`, so swapping to SQLite/Postgres later should only require a new adapter instead of route-level rewrites.
