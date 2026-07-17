# RetroDex Backend — FastAPI + Neon

## What is this
- `/pokemon` — list Pokémon, filterable by `?generation=1`, `?type=fire`, `?search=char`
- `/pokemon/{id}` — full detail for one Pokémon (stats, types, abilities, flavor text)
- `/type-effectiveness?types=fire,flying` — type matchup calculator (also usable as an AI agent tool)
- `seed.py` — one-time script that pulls Gen 1-3 data from PokeAPI into your own Neon Postgres tables

## Step-by-step setup

### 1. Create your Neon database
1. Go to [neon.tech](https://neon.tech), sign up free, create a new project.
2. On the project dashboard, find **Connection Details** and copy the connection string. It looks like:
   ```
   postgresql://user:password@ep-xxxx.region.aws.neon.tech/retrodex_example?sslmode=require
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
This fetches Pokémon #1–386 (Gen 1-3) from PokeAPI and writes them into your Neon tables. 
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

## Notes
- Sprites point to PokeAPI's Gen 3 (Ruby/Sapphire) sprite set, matching the frontend.
- Re-running `seed.py` is safe — it upserts (deletes and re-inserts) each Pokémon rather than erroring on duplicates.
- `type_chart.py` is deliberately a plain Python dict, not DB-backed — type effectiveness is static game data, no need to query it.
