# AegisBuff — real Dota 2 analytics

AegisBuff is now a real-data application rather than a demo. The browser talks to the AegisBuff Express API; the API talks to OpenDota. Gemini is called only by the server when configured.

## What was removed

- hardcoded player/match IDs
- fake pro-player and match lists
- simulated live match HUD/chat
- hardcoded Patch 7.36c labels
- fake item timing/win-rate curves
- fake AI benchmark numbers and replay incidents
- client-side direct OpenDota requests
- localStorage "demo mode"
- demo user account

## What is real now

- heroes: OpenDota `heroStats`
- player search: OpenDota search
- player profile / win-loss / matches / hero history / totals: OpenDota player endpoints
- match detail and gold/XP timelines: OpenDota match endpoint
- professional matches: OpenDota `proMatches`
- professional players: OpenDota `proPlayers`
- hero matchups: OpenDota hero matchup endpoint
- Steam sign-in: Steam OpenID verification on the server
- AI Coach: Gemini receives only the OpenDota dataset supplied by the backend and is instructed not to invent missing telemetry

The application deliberately does **not** claim that OpenDota is a verified live in-game telemetry feed. The old live screen is now a status panel. Replay-event analysis and item-build aggregation are left blank until the corresponding real event pipeline is implemented.

## 1. Local setup

Requirements: Node.js 20+.

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000`.

For real OpenDota data no frontend key is required. If you have an OpenDota API key, put it only in `OPENDOTA_API_KEY` in `.env`.

For AI Coach, put your Gemini key in `GEMINI_API_KEY`. Do not put that key in a `VITE_*` variable.

## 2. Steam login locally

Set:

```env
FRONTEND_URL=http://localhost:3000
API_PUBLIC_URL=http://localhost:4000
SESSION_SECRET=<long-random-secret>
```

Click **Sign in with Steam**. Steam redirects back to the API callback, the callback verifies the OpenID response with Steam, creates an HTTP-only signed session cookie, and redirects to the frontend.

## 3. Production on Render

1. Push this folder to GitHub.
2. In Render, create a **Web Service** from the repository.
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Set `FRONTEND_URL` to the public Render URL, for example `https://aegisbuff.onrender.com`.
6. Set `API_PUBLIC_URL` to the same public Render URL if the API and frontend are served by the same service.
7. Add `SESSION_SECRET` as a long random secret.
8. Add `OPENDOTA_API_KEY` if you have one.
9. Add `GEMINI_API_KEY` if AI Coach is required.
10. Keep `VITE_API_URL` empty when frontend and API are served by the same Render service.

A ready `render.yaml` is included.

## 4. Important security rules

Never commit `.env`.
Never expose `OPENDOTA_API_KEY`, `GEMINI_API_KEY` or `SESSION_SECRET` to the browser.
Only public, non-secret configuration should use `VITE_*` variables.

## 5. Next production phase

The current foundation is intentionally honest about the data boundary. To add the remaining production features:

1. PostgreSQL for users, favorites, synchronized matches and AI reports.
2. Redis for shared cache and rate-limit coordination.
3. A background sync worker for pro matches and player/match enrichment.
4. Item purchase aggregation from real parsed match details.
5. A verified replay/telemetry ingestion source before exposing live/replay incident UI.
6. WebSocket delivery only after a real live source exists.

Do not turn any of those screens back into mock data while the source is unavailable.
