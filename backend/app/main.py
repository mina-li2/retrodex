import os
from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .database import get_db
from . import models, schemas
from .type_chart import full_matchup, ALL_TYPES
from .chat import get_oak_reply

app = FastAPI(title="RetroDex API")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests — slow down a little and try again shortly."},
    )


origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/pokemon", response_model=list[schemas.PokemonListItem])
@limiter.limit("60/minute")
def list_pokemon(
    request: Request,
    generation: int | None = Query(None, description="Filter by generation, e.g. 1, 2, 3"),
    type: str | None = Query(None, description="Filter by type, e.g. 'fire'"),
    search: str | None = Query(None, description="Case-insensitive name search"),
    db: Session = Depends(get_db),
):
    query = db.query(models.Pokemon).options(selectinload(models.Pokemon.types))

    if generation is not None:
        query = query.filter(models.Pokemon.generation == generation)
    if search:
        query = query.filter(models.Pokemon.name.ilike(f"%{search}%"))
    if type:
        query = query.join(models.PokemonType).filter(models.PokemonType.type == type.lower())

    pokemon_list = query.order_by(models.Pokemon.id).all()

    return [
        schemas.PokemonListItem(
            id=p.id,
            name=p.name,
            species=p.species,
            generation=p.generation,
            sprite_url=p.sprite_url,
            types=[t.type for t in p.types],
        )
        for p in pokemon_list
    ]


@app.get("/pokemon/{pokemon_id}", response_model=schemas.PokemonDetail)
@limiter.limit("60/minute")
def get_pokemon(request: Request, pokemon_id: int, db: Session = Depends(get_db)):
    p = db.get(models.Pokemon, pokemon_id)
    if not p:
        raise HTTPException(status_code=404, detail="Pokemon not found")

    return schemas.PokemonDetail(
        id=p.id,
        name=p.name,
        species=p.species,
        generation=p.generation,
        height=p.height,
        weight=p.weight,
        sprite_url=p.sprite_url,
        flavor_text=p.flavor_text,
        types=[t.type for t in p.types],
        abilities=[a.ability_name for a in p.abilities],
        stats=schemas.StatsOut.model_validate(p.stats) if p.stats else None,
    )


@app.get("/type-effectiveness")
@limiter.limit("60/minute")
def type_effectiveness(request: Request, types: str = Query(..., description="Comma-separated types, e.g. 'fire,flying'")):
    defending_types = [t.strip().lower() for t in types.split(",") if t.strip()]
    invalid = [t for t in defending_types if t not in ALL_TYPES]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Unknown type(s): {invalid}")

    matchup = full_matchup(defending_types)
    return {
        "defending_types": defending_types,
        "weak_to": {t: m for t, m in matchup.items() if m > 1},
        "resists": {t: m for t, m in matchup.items() if 0 < m < 1},
        "immune_to": [t for t, m in matchup.items() if m == 0],
    }


@app.post("/chat", response_model=schemas.ChatResponse)
@limiter.limit("10/minute")
def chat(request: Request, body: schemas.ChatRequest):
    reply = get_oak_reply(body.message, [m.model_dump() for m in body.history])
    return schemas.ChatResponse(reply=reply)