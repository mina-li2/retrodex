# RetroDex Frontend — Next.js

This is your Lovable-designed RetroDex UI, ported to Next.js and wired to the real
FastAPI + Neon backend instead of hardcoded dummy data. Visually, it's unchanged —
same fonts, colors, layout, animations. What changed:

- Emoji sprites → real Gen 3 (Ruby/Sapphire) pixel sprites, fetched from your API.
- Hardcoded `DEX` array → live `fetch()` calls to your backend (`lib/api.ts`).
- TanStack Start routing → Next.js App Router (`app/page.tsx`).

## Setup

### 1. Install dependencies
```bash
cd retrodex-nextjs
npm install
```

### 2. Point it at your backend
```bash
cp .env.local.example .env.local
```
The default (`http://localhost:8000`) already matches the backend's local dev server —
no edit needed if you're running both locally. Change it once you deploy the backend
to Render (Step 4 below).

### 3. Run it
Make sure your FastAPI backend (from `retrodex-backend.zip`) is running first —
see its README for setup. Then, in this project:
```bash
npm run dev
```
Visit `http://localhost:3000`. You should see the boot screen, then the full grid of
seeded Pokémon with real sprites, working search/filter, and detail view with real
stats pulled from your Neon database.


## Troubleshooting
- **Blank grid / "Couldn't reach the Dex API" message:** backend isn't running, or
  `NEXT_PUBLIC_API_URL` is wrong. Check `http://localhost:8000/docs` loads in your browser.
- **CORS error in browser console:** backend's `CORS_ORIGINS` doesn't include your
  frontend's actual URL (`http://localhost:3000` for local dev).
