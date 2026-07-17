export type PokeType =
  | "fire" | "water" | "grass" | "electric" | "psychic" | "normal"
  | "flying" | "poison" | "ice" | "rock" | "ground" | "fairy"
  | "fighting" | "bug" | "ghost" | "dragon" | "dark" | "steel";

export type Poke = {
  id: number;
  name: string;
  species: string;
  types: PokeType[];
  gen: 1 | 2 | 3;
  sprite: string;
  height: string;
  weight: string;
  desc: string;
  stats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
};

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");
// Shapes returned by the FastAPI backend (see backend/app/schemas.py)
type ApiListItem = {
  id: number;
  name: string;
  species: string | null;
  generation: number;
  sprite_url: string | null;
  types: string[];
};

type ApiDetail = ApiListItem & {
  height: string | null;
  weight: string | null;
  flavor_text: string | null;
  abilities: string[];
  stats: {
    hp: number;
    attack: number;
    defense: number;
    sp_attack: number;
    sp_defense: number;
    speed: number;
  } | null;
};

function mapListItem(item: ApiListItem): Poke {
  return {
    id: item.id,
    name: item.name,
    species: item.species ?? "",
    types: item.types as PokeType[],
    gen: (item.generation as 1 | 2 | 3) ?? 1,
    sprite: item.sprite_url ?? "",
    height: "",
    weight: "",
    desc: "",
    stats: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  };
}

function mapDetail(item: ApiDetail): Poke {
  return {
    ...mapListItem(item),
    height: item.height ?? "",
    weight: item.weight ?? "",
    desc: item.flavor_text ?? "",
    stats: item.stats
      ? {
          hp: item.stats.hp,
          atk: item.stats.attack,
          def: item.stats.defense,
          spa: item.stats.sp_attack,
          spd: item.stats.sp_defense,
          spe: item.stats.speed,
        }
      : { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  };
}

export async function fetchPokemonList(): Promise<Poke[]> {
  const res = await fetch(`${API_URL}/pokemon`);
  if (!res.ok) throw new Error(`Failed to fetch pokemon list: ${res.status}`);
  const data: ApiListItem[] = await res.json();
  return data.map(mapListItem);
}

export async function fetchPokemonDetail(id: number): Promise<Poke> {
  const res = await fetch(`${API_URL}/pokemon/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch pokemon ${id}: ${res.status}`);
  const data: ApiDetail = await res.json();
  return mapDetail(data);
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function sendChatMessage(message: string, history: ChatMessage[]): Promise<string> {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) throw new Error(`Chat request failed: ${res.status}`);
  const data = await res.json();
  return data.reply;
}