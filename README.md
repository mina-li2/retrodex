# RetroDex

A fan-made, retro GBA-styled Pokédex covering Kanto, Johto, and Hoenn (Gen 1–3) — browse the regional dex, check stats and abilities, and chat with Professor Oak, who looks up real Pokémon data live rather than reciting canned answers.

**🔗 Live site:** [retrodex-minali-v.vercel.app](https://retrodex-minali-v.vercel.app/)
(Render's free tier sleeps after inactivity — first request after idle takes ~30-50s.)

## Features

- **Full Gen 1–3 Pokédex** — browse, search by name, and filter by generation or type
- **Detailed entries** — base stats, abilities, height/weight, and Pokédex flavor text for every Pokémon
- **Type effectiveness calculator** — see what a given type combo is weak to, resists, or is immune to
- **Professor Oak chatbot** — an LLM-backed assistant (Groq/Llama 3.3) with tool-calling access to the live database, so it answers with real stats instead of guessing
- Retro pixel-art aesthetic — chunky borders, hard shadows, GBA-era color palette

## Tech stack

**Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
**Backend:** FastAPI, SQLAlchemy, PostgreSQL (hosted on Neon)
**Chatbot:** Groq API (Llama 3.3 70B) with function/tool-calling into the Pokémon database
**Data source:** [PokéAPI](https://pokeapi.co/), seeded into a self-hosted Postgres database


## Getting started

This is a two-part app — you'll need both running locally to use it:

1. **Backend setup** → see [`backend/README.md`](./backend/README.md) for creating your Neon database, seeding Pokémon data, and running the FastAPI server
2. **Frontend setup** → see [`retrodex-nextjs/README.md`](./retrodex-nextjs/README.md) for running the Next.js dev server

Once both are running (backend on `:8000`, frontend on `:3000` by default), open `http://localhost:3000`.

## How the chatbot works

Professor Oak isn't a static FAQ bot — each message goes to Llama 3.3 via Groq, which decides whether it needs to look something up. If you ask about a specific Pokémon's stats or "what beats a fire/flying type," the model calls one of three tools (`search_pokemon`, `get_pokemon_details`, `get_type_effectiveness`) that query the live database or the type chart directly, then answers using that real data. No chat history is stored server-side — conversations reset when you refresh the page.

## Disclaimer

This is a non-commercial, fan-made reference project built for portfolio/learning purposes. It is not affiliated with, endorsed by, or sponsored by Nintendo, Creatures Inc., GAME FREAK Inc., or The Pokémon Company. Pokémon and all related names, terms, and images are trademarks of their respective owners, used here under fair use for an educational fan reference. See [LICENSE](./LICENSE) for full details.

## License

MIT for the original code in this repository — see [LICENSE](./LICENSE). Pokémon-related data and trademarks are excluded and remain the property of their respective owners.
