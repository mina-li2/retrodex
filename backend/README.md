# RetroDex Backend — FastAPI + Neon

## What this is
- `/pokemon` — list Pokémon, filterable by `?generation=1`, `?type=fire`, `?search=char`
- `/pokemon/{id}` — full detail for one Pokémon (stats, types, abilities, flavor text)
- `/type-effectiveness?types=fire,flying` — type matchup calculator (also usable as an AI agent tool later)
- `seed.py` — one-time script that pulls Gen 1-3 data from PokeAPI into your own Neon Postgres tables

## Step-by-step setup

### 1. Create your Neon database
1. Go to [neon.tech](https://neon.tech), sign up free, create a new project (name it `retrodex` or similar).
2. On the project dashboard, find **Connection Details** and copy the connection string. It looks like:
   ```
   postgresql://user:password@ep-xxxx.region.aws.neon.tech/retrodex?sslmode=require
   ```

### 2. Set up the backend locally
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # on Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure environment variables
```bash
cp .env.example .env
```
Open `.env` and paste in your real Neon connection string from Step 1.

### 4. Seed the database
This fetches Pokémon #1–386 (Gen 1-3) from PokeAPI and writes them into your Neon tables. Takes a few minutes (it's rate-limiting itself to be polite to PokeAPI's free API).
```bash
python seed.py
```
To seed a smaller range while testing (e.g. just the first 20):
```bash
python seed.py 1 20
```

### 5. Run the API locally
```bash
uvicorn app.main:app --reload
```
Visit `http://localhost:8000/docs` — FastAPI auto-generates interactive API docs here. Try `/pokemon` and `/pokemon/1` right in the browser.

### 6. Point your frontend at it
In your frontend project, replace the hardcoded `DEX` array with a fetch to this API, e.g.:
```ts
const res = await fetch("http://localhost:8000/pokemon");
const pokemon = await res.json();
```
(We'll wire this up properly with TanStack Query in the next step — this is just to confirm the connection works.)

### 7. Deploy
- **Database:** already deployed — Neon is always-on/serverless, nothing more to do.
- **Backend:** push this `backend/` folder to its own GitHub repo (or a subfolder of your monorepo), then on [render.com](https://render.com): New → Web Service → connect the repo → set:
  - Build command: `pip install -r requirements.txt`
  - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  - Add your `DATABASE_URL` and `CORS_ORIGINS` (your deployed frontend URL) as environment variables in Render's dashboard — don't commit `.env`.
- Render's free tier sleeps after inactivity — first request after idle takes ~30-50s. Expected, not a bug.

## Notes
- Sprites point to PokeAPI's Gen 3 (Ruby/Sapphire) sprite set, matching the frontend.
- Re-running `seed.py` is safe — it upserts (deletes and re-inserts) each Pokémon rather than erroring on duplicates.
- `type_chart.py` is deliberately a plain Python dict, not DB-backed — type effectiveness is static game data, no need to query it.
