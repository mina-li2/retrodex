import os
import json
from groq import Groq
from sqlalchemy.orm import selectinload
import re

from .database import SessionLocal
from . import models
from .type_chart import full_matchup, ALL_TYPES

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """You are Professor Oak, the renowned Pokémon researcher, speaking to a trainer inside the RetroDex app (a fan-made Pokédex covering Gen 1-3 Pokémon only).

Stay in character: warm, a little scatterbrained, endlessly enthusiastic about Pokémon research. Keep answers SHORT — 2-4 sentences, chat-bubble length, not lecture length.

You have tools to look up real data from the RetroDex database (Gen 1-3 only). Use them whenever a trainer asks about a specific Pokémon's stats, types, abilities, or type matchups — don't guess or rely on memory for numbers. If they ask about a Pokémon outside Gen 1-3 (Sinnoh onward), gently say your research so far only covers Kanto, Johto, and Hoenn.

If a tool lookup fails (Pokémon not found), say so in character rather than inventing an answer."""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_pokemon",
            "description": "Search for Pokémon by name (partial match) or filter by generation/type. Returns a short list of matches with id, name, types, generation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Partial or full Pokémon name to search for"},
                    "generation": {"type": "integer", "description": "Filter by generation: 1, 2, or 3"},
                    "type": {"type": "string", "description": "Filter by type, e.g. 'fire'"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_pokemon_details",
            "description": "Get full details for one specific Pokémon by its exact name or national dex id — stats, abilities, height, weight, flavor text.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name_or_id": {"type": "string", "description": "Pokémon name (e.g. 'Charizard') or dex number (e.g. '6')"},
                },
                "required": ["name_or_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_type_effectiveness",
            "description": "Given one or two defending types, return what's super effective, not very effective, and immune against them.",
            "parameters": {
                "type": "object",
                "properties": {
                    "types": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of 1-2 type names, e.g. ['fire', 'flying']",
                    },
                },
                "required": ["types"],
            },
        },
    },
]


def _search_pokemon(name=None, generation=None, type=None):
    db = SessionLocal()
    try:
        query = db.query(models.Pokemon).options(selectinload(models.Pokemon.types))
        if name:
            query = query.filter(models.Pokemon.name.ilike(f"%{name}%"))
        if generation:
            query = query.filter(models.Pokemon.generation == generation)
        if type:
            query = query.join(models.PokemonType).filter(models.PokemonType.type == type.lower())
        results = query.order_by(models.Pokemon.id).limit(10).all()
        return [
            {"id": p.id, "name": p.name, "generation": p.generation, "types": [t.type for t in p.types]}
            for p in results
        ]
    finally:
        db.close()


def _get_pokemon_details(name_or_id):
    db = SessionLocal()
    try:
        query = db.query(models.Pokemon).options(
            selectinload(models.Pokemon.types),
            selectinload(models.Pokemon.abilities),
            selectinload(models.Pokemon.stats),
        )
        if str(name_or_id).isdigit():
            p = query.filter(models.Pokemon.id == int(name_or_id)).first()
        else:
            p = query.filter(models.Pokemon.name.ilike(name_or_id)).first()

        if not p:
            return {"error": f"No Pokémon found matching '{name_or_id}'"}

        return {
            "id": p.id,
            "name": p.name,
            "species": p.species,
            "generation": p.generation,
            "height": p.height,
            "weight": p.weight,
            "types": [t.type for t in p.types],
            "abilities": [a.ability_name for a in p.abilities],
            "stats": {
                "hp": p.stats.hp, "attack": p.stats.attack, "defense": p.stats.defense,
                "sp_attack": p.stats.sp_attack, "sp_defense": p.stats.sp_defense, "speed": p.stats.speed,
            } if p.stats else None,
            "flavor_text": p.flavor_text,
        }
    finally:
        db.close()


def _get_type_effectiveness(types):
    defending_types = [t.strip().lower() for t in types if t.strip()]
    invalid = [t for t in defending_types if t not in ALL_TYPES]
    if invalid:
        return {"error": f"Unknown type(s): {invalid}"}

    matchup = full_matchup(defending_types)
    return {
        "defending_types": defending_types,
        "weak_to": {t: m for t, m in matchup.items() if m > 1},
        "resists": {t: m for t, m in matchup.items() if 0 < m < 1},
        "immune_to": [t for t, m in matchup.items() if m == 0],
    }


TOOL_FUNCTIONS = {
    "search_pokemon": _search_pokemon,
    "get_pokemon_details": _get_pokemon_details,
    "get_type_effectiveness": _get_type_effectiveness,
}

FUNCTION_TAG_RE = re.compile(r"<function=.*?</function>", re.DOTALL)
def _run_tool(fn_name: str, fn_args: dict):
    fn = TOOL_FUNCTIONS.get(fn_name)
    if not fn:
        return {"error": f"Unknown tool '{fn_name}'"}
    try:
        return fn(**fn_args)
    except TypeError as e:
        # model passed a wrong/missing argument name
        return {"error": f"Bad arguments for {fn_name}: {e}"}
    except Exception as e:
        return {"error": f"Tool '{fn_name}' failed: {e}"}


def get_oak_reply(message: str, history: list[dict]) -> str:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(history[-10:])
    messages.append({"role": "user", "content": message})

    try:
        max_rounds = 4
        reply_msg = None

        for _ in range(max_rounds):
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                tools=TOOLS,
                tool_choice="auto",
                max_tokens=400,
            )
            reply_msg = response.choices[0].message

            if not reply_msg.tool_calls:
                break  # model gave a final answer, stop looping

            messages.append(reply_msg)
            for call in reply_msg.tool_calls:
                fn_args = {}
                try:
                    fn_args = json.loads(call.function.arguments or "{}")
                except json.JSONDecodeError:
                    pass
                result = _run_tool(call.function.name, fn_args)
                messages.append({
                    "role": "tool",
                    "tool_call_id": call.id,
                    "content": json.dumps(result),
                })

        content = (reply_msg.content if reply_msg else None) or \
            "Hmm, my notes seem to be a bit scrambled — could you ask that again?"

        # Safety net: strip any raw <function=...> text the model might still leak
        content = FUNCTION_TAG_RE.sub("", content).strip()
        return content or "Let me consult my notes and get back to you on that!"

    except Exception as e:
        print(f"[CHAT ERROR] {e}")
        return "Oh dear, my equipment seems to be malfunctioning. Try again in a moment?"