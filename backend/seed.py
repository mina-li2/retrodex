"""
One-time (or re-runnable) seed script: pulls Pokemon data from PokeAPI and
populates your own Neon Postgres tables, per the RetroDex data model.

Usage:
    python seed.py            # seeds national dex #1-386 (Gen 1-3, matches the mockup's scope)
    python seed.py 1 151      # seed a custom id range, e.g. just Gen 1
"""
import sys
import time
import requests
from sqlalchemy.orm import Session

from app.database import engine, SessionLocal, Base
from app import models

POKEAPI_BASE = "https://pokeapi.co/api/v2"
SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/ruby-sapphire"

GEN_RANGES = [
    (1, 151, 1),
    (152, 251, 2),
    (252, 386, 3),
]


def generation_for_id(pokemon_id: int) -> int:
    for start, end, gen in GEN_RANGES:
        if start <= pokemon_id <= end:
            return gen
    return 4  # fallback for anything outside the seeded default range


def format_height(decimeters: int) -> str:
    total_inches = round(decimeters * 3.937)
    feet, inches = divmod(total_inches, 12)
    return f"{feet}'{inches:02d}\""


def format_weight(hectograms: int) -> str:
    lbs = round(hectograms * 0.220462, 1)
    return f"{lbs} lbs"


def fetch_pokemon(pokemon_id: int) -> dict | None:
    resp = requests.get(f"{POKEAPI_BASE}/pokemon/{pokemon_id}")
    if resp.status_code != 200:
        print(f"  ! skipping id {pokemon_id}: pokemon endpoint returned {resp.status_code}")
        return None
    data = resp.json()

    species_resp = requests.get(f"{POKEAPI_BASE}/pokemon-species/{pokemon_id}")
    species_data = species_resp.json() if species_resp.status_code == 200 else {}

    flavor_text = ""
    for entry in species_data.get("flavor_text_entries", []):
        if entry["language"]["name"] == "en":
            flavor_text = entry["flavor_text"].replace("\n", " ").replace("\f", " ")
            break

    species_label = ""
    for genus in species_data.get("genera", []):
        if genus["language"]["name"] == "en":
            species_label = genus["genus"].replace(" Pokémon", "").replace(" Pokemon", "")
            break

    stats = {s["stat"]["name"]: s["base_stat"] for s in data["stats"]}

    return {
        "id": data["id"],
        "name": data["name"].capitalize(),
        "species": species_label,
        "height": format_height(data["height"]),
        "weight": format_weight(data["weight"]),
        "types": [t["type"]["name"] for t in data["types"]],
        "abilities": [a["ability"]["name"].replace("-", " ").title() for a in data["abilities"]],
        "flavor_text": flavor_text,
        "stats": {
            "hp": stats.get("hp", 0),
            "attack": stats.get("attack", 0),
            "defense": stats.get("defense", 0),
            "sp_attack": stats.get("special-attack", 0),
            "sp_defense": stats.get("special-defense", 0),
            "speed": stats.get("speed", 0),
        },
    }


def upsert_pokemon(db: Session, info: dict):
    pokemon_id = info["id"]

    existing = db.get(models.Pokemon, pokemon_id)
    if existing:
        db.query(models.PokemonType).filter_by(pokemon_id=pokemon_id).delete()
        db.query(models.PokemonAbility).filter_by(pokemon_id=pokemon_id).delete()
        db.query(models.PokemonStat).filter_by(pokemon_id=pokemon_id).delete()
        db.delete(existing)
        db.flush()

    pokemon = models.Pokemon(
        id=pokemon_id,
        name=info["name"],
        species=info["species"],
        generation=generation_for_id(pokemon_id),
        height=info["height"],
        weight=info["weight"],
        sprite_url=f"{SPRITE_BASE}/{pokemon_id}.png",
        flavor_text=info["flavor_text"],
    )
    db.add(pokemon)

    for t in info["types"]:
        db.add(models.PokemonType(pokemon_id=pokemon_id, type=t))

    for a in info["abilities"]:
        db.add(models.PokemonAbility(pokemon_id=pokemon_id, ability_name=a))

    db.add(models.PokemonStat(pokemon_id=pokemon_id, **info["stats"]))


def main():
    start_id = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    end_id = int(sys.argv[2]) if len(sys.argv) > 2 else 386

    print(f"Creating tables (if they don't already exist)...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        for pokemon_id in range(start_id, end_id + 1):
            print(f"Fetching #{pokemon_id}...")
            info = fetch_pokemon(pokemon_id)
            if info:
                upsert_pokemon(db, info)
                db.commit()
            time.sleep(0.05)  # be polite to PokeAPI's free public API
        print(f"Done. Seeded ids {start_id}-{end_id}.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
