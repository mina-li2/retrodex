from pydantic import BaseModel, ConfigDict


class StatsOut(BaseModel):
    hp: int
    attack: int
    defense: int
    sp_attack: int
    sp_defense: int
    speed: int

    model_config = ConfigDict(from_attributes=True)


class PokemonListItem(BaseModel):
    id: int
    name: str
    species: str | None
    generation: int
    sprite_url: str | None
    types: list[str]

    model_config = ConfigDict(from_attributes=True)


class PokemonDetail(BaseModel):
    id: int
    name: str
    species: str | None
    generation: int
    height: str | None
    weight: str | None
    sprite_url: str | None
    flavor_text: str | None
    types: list[str]
    abilities: list[str]
    stats: StatsOut | None

    model_config = ConfigDict(from_attributes=True)

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str