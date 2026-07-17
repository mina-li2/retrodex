"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchPokemonList, fetchPokemonDetail, sendChatMessage, type Poke, type PokeType, type ChatMessage } from "@/lib/api";
const ALL_TYPES: PokeType[] = [
  "fire", "water", "grass", "electric", "psychic", "normal", "flying", "poison",
  "ice", "rock", "ground", "fairy", "fighting", "bug", "ghost", "dragon", "dark", "steel",
];
function DexIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="2" width="18" height="20" rx="1" fill="var(--dex-red)" stroke="var(--dex-outline)" strokeWidth="1.5" />
      <rect x="3" y="2" width="4" height="20" fill="var(--dex-outline)" opacity="0.25" />
      <circle cx="8" cy="7" r="2" fill="var(--dex-yellow)" stroke="var(--dex-outline)" strokeWidth="1" />
      <rect x="12" y="12" width="6" height="1.5" fill="oklch(0.98 0.01 90)" opacity="0.85" />
      <rect x="12" y="15" width="6" height="1.5" fill="oklch(0.98 0.01 90)" opacity="0.6" />
      <rect x="12" y="18" width="4" height="1.5" fill="oklch(0.98 0.01 90)" opacity="0.4" />
    </svg>
  );
}

function FlaskIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 2h6v6l5 10a2 2 0 0 1-2 3H6a2 2 0 0 1-2-3l5-10V2z" fill="var(--dex-yellow)" stroke="var(--dex-outline)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7.5 14h9" stroke="var(--dex-outline)" strokeWidth="1.5" />
      <circle cx="10" cy="17.5" r="0.8" fill="var(--dex-red)" />
      <circle cx="13.5" cy="18.5" r="0.6" fill="var(--dex-blue)" />
    </svg>
  );
}
function TypeBadge({ t }: { t: PokeType }) {
  return (
    <span className="type-badge" style={{ backgroundColor: `var(--type-${t})` }}>
      {t}
    </span>
  );
}

function Dexno({ n }: { n: number }) {
  return (
    <span className="font-pixel text-[0.6rem] text-muted-foreground">
      №{String(n).padStart(3, "0")}
    </span>
  );
}

function StatBar({ label, value }: { label: string; value: number }) {
  const segments = 10;
  const filled = Math.round((value / 100) * segments);
  return (
    <div className="flex items-center gap-3">
      <span className="font-pixel w-14 shrink-0 text-[0.55rem] uppercase text-muted-foreground">{label}</span>
      <div className="flex min-w-0 flex-1 items-center gap-1 rounded-md border-2 border-[var(--dex-outline)] bg-[oklch(0.16_0.02_250)] p-1">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className="h-3 flex-1 rounded-[2px]"
            style={{
              backgroundColor:
                i < filled
                  ? i < 3 ? "var(--dex-red)" : i < 7 ? "var(--dex-yellow)" : "oklch(0.7 0.17 145)"
                  : "oklch(0.3 0.02 250)",
              boxShadow: i < filled ? "inset 0 0 0 1px oklch(0 0 0 / 0.35)" : undefined,
            }}
          />
        ))}
      </div>
      <span className="font-pixel w-8 shrink-0 text-right text-[0.6rem] tabular-nums">{value}</span>
    </div>
  );
}

function Sprite({ p, size = "md" }: { p: Poke; size?: "sm" | "md" | "lg" }) {
  const dims = size === "lg" ? "w-28 h-28 sm:w-32 sm:h-32" : size === "sm" ? "w-14 h-14" : "w-20 h-20";
  return (
    <div className="dex-screen grid aspect-square place-items-center overflow-hidden" aria-hidden>
      <img
        src={p.sprite}
        alt={p.name}
        className={`${dims} drop-shadow-[2px_2px_0_rgba(0,0,0,0.35)]`}
        style={{ imageRendering: "pixelated" }}
        loading="lazy"
      />
    </div>
  );
}

function BootScreen({ onEnter }: { onEnter: () => void }) {
  return (
    <section className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-4 py-16">
      <div className="panel-lg relative w-full overflow-hidden bg-[var(--dex-red)] p-6 sm:p-10">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="led-pulse grid h-6 w-6 shrink-0 place-items-center rounded-full border-[3px] border-[var(--dex-outline)] bg-white">
              <span className="h-2 w-2 rounded-full bg-[var(--dex-red)]" />
            </span>
            <span className="led-blink h-3 w-3 shrink-0 rounded-full border-2 border-[var(--dex-outline)] bg-[var(--dex-yellow)]" />
            <span className="h-3 w-3 shrink-0 rounded-full border-2 border-[var(--dex-outline)] bg-[var(--dex-blue)]" />
            <span className="h-3 w-3 shrink-0 rounded-full border-2 border-[var(--dex-outline)] bg-[oklch(0.7_0.17_145)]" />
          </div>
          <span className="font-pixel truncate rounded-md border-[3px] border-[var(--dex-outline)] bg-[var(--dex-outline)] px-2 py-1 text-[0.55rem] text-[var(--dex-yellow)]">
            v3.86 · REGION HOENN
          </span>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0">
            <p className="font-pixel text-[0.55rem] uppercase tracking-widest text-[oklch(0.98_0.01_90/0.75)]">
              Powering On · Handheld Encyclopedia
            </p>
            <h1 className="mt-3 font-pixel text-[2rem] leading-[1.05] text-[oklch(0.98_0.01_90)] sm:text-5xl md:text-6xl">
              Retro<span className="text-[var(--dex-yellow)]">Dex</span>
            </h1>
            <p className="mt-6 max-w-lg text-sm leading-relaxed text-[oklch(0.98_0.01_90/0.9)] sm:text-base">
              A fan-made Pokédex covering Kanto, Johto, and Hoenn. Search the full
  regional dex, flip through stats and abilities, and ask Professor Oak
  anything you're curious about.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button onClick={onEnter} className="chunk-btn chunk-btn-yellow text-[0.75rem]">
                ▶ Boot the Dex
              </button>
              <span className="font-pixel text-[0.55rem] uppercase text-[oklch(0.98_0.01_90/0.7)]">
                Press <span className="rounded border border-[var(--dex-outline)] bg-[var(--dex-outline)] px-1.5 py-0.5 text-[var(--dex-yellow)]">A</span> to continue
              </span>
            </div>
          </div>

          <div className="panel bg-[var(--dex-outline)] p-4">
            <div className="dex-screen relative aspect-[4/3] w-full min-w-0 p-4 sm:w-72">
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="font-pixel text-[0.55rem] uppercase">Loading Dex Data...</div>
                <DexIcon className="w-16 h-16" />
                <div className="w-full">
                  <div className="mx-auto h-3 w-4/5 rounded-sm border-2 border-[var(--dex-outline)] bg-[oklch(0.16_0.02_250)]">
                    <div className="h-full w-3/4 rounded-[1px] bg-[var(--dex-red)]" />
                  </div>
                  <div className="mt-1 font-pixel text-[0.5rem]">████████░░ 75%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-8 max-w-md text-center font-pixel text-[0.5rem] leading-relaxed text-muted-foreground">
  A NON-COMMERCIAL FAN PROJECT BY {"MINALI V"} · NOT AFFILIATED WITH OR ENDORSED BY NINTENDO, GAME FREAK, OR THE POKÉMON COMPANY · POKÉMON AND ALL RELATED NAMES ARE TRADEMARKS OF THEIR RESPECTIVE OWNERS
</p>
    </section>
  );
}

function DexList({
  query, setQuery, typeFilter, setTypeFilter,
  genFilter, setGenFilter, filtered, onOpen, onOpenChat,
}: {
  query: string; setQuery: (s: string) => void;
  typeFilter: PokeType | "all"; setTypeFilter: (t: PokeType | "all") => void;
  genFilter: 1 | 2 | 3 | "all"; setGenFilter: (g: 1 | 2 | 3 | "all") => void;
  filtered: Poke[]; onOpen: (id: number) => void; onOpenChat: () => void;
}) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-[3px] border-[var(--dex-outline)] bg-[var(--dex-red)] shadow-[var(--shadow-hard)]">
            <span className="led-blink h-3 w-3 rounded-full border-2 border-[var(--dex-outline)] bg-[var(--dex-yellow)]" />
          </div>
          <div className="min-w-0">
            <p className="font-pixel text-[0.55rem] uppercase text-muted-foreground">Handheld Encyclopedia</p>
            <h2 className="truncate font-pixel text-xl text-foreground sm:text-2xl">
              Retro<span className="text-[var(--dex-yellow)]">Dex</span>
            </h2>
          </div>
        </div>
        <button onClick={onOpenChat} className="chunk-btn chunk-btn-blue hidden sm:inline-flex">
          💬 Ask Prof. Oak
        </button>
      </header>

      <div className="panel mt-6 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label className="flex min-w-0 items-center gap-3 rounded-xl border-[3px] border-[var(--dex-outline)] bg-[var(--dex-screen)] px-3 py-2 shadow-[inset_0_0_0_3px_oklch(0.72_0.09_145)]">
            <span className="font-pixel text-[0.6rem] uppercase text-[var(--dex-outline)]">Search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. PIKACHU"
              className="min-w-0 flex-1 bg-transparent font-pixel text-[0.7rem] uppercase text-[var(--dex-outline)] placeholder:text-[oklch(0.22_0.03_250/0.5)] focus:outline-none"
            />
            <span className="led-blink font-pixel text-[0.55rem] text-[var(--dex-outline)]">▮</span>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <span className="font-pixel text-[0.55rem] uppercase text-muted-foreground">Gen</span>
            {(["all", 1, 2, 3] as const).map((g) => (
              <button
                key={String(g)}
                onClick={() => setGenFilter(g)}
                className={`chunk-btn ${genFilter === g ? "chunk-btn-red" : ""}`}
                style={{ padding: "0.4rem 0.65rem", fontSize: "0.55rem" }}
              >
                {g === "all" ? "ALL" : `G${g}`}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t-[3px] border-dashed border-[var(--dex-outline)] pt-4">
          <span className="font-pixel text-[0.55rem] uppercase text-muted-foreground">Type</span>
          <button
            onClick={() => setTypeFilter("all")}
            className={`chunk-btn ${typeFilter === "all" ? "chunk-btn-yellow" : ""}`}
            style={{ padding: "0.35rem 0.6rem", fontSize: "0.5rem" }}
          >
            ALL
          </button>
          {ALL_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className="type-badge"
              style={{
                backgroundColor: `var(--type-${t})`,
                outline: typeFilter === t ? "3px solid var(--dex-yellow)" : "none",
                outlineOffset: "2px",
                cursor: "pointer",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {filtered.map((p) => (
          <button
            key={p.id}
            onClick={() => onOpen(p.id)}
            className="panel group flex flex-col gap-3 p-3 text-left transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--dex-outline)] sm:p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <Dexno n={p.id} />
              <span className="font-pixel text-[0.5rem] uppercase text-muted-foreground">G{p.gen}</span>
            </div>
            <Sprite p={p} />
            <div className="min-w-0">
              <h3 className="truncate font-pixel text-[0.75rem] uppercase text-foreground">{p.name}</h3>
              <p className="mt-0.5 truncate text-[0.7rem] text-muted-foreground">{p.species} Pokémon</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {p.types.map((t) => <TypeBadge key={t} t={t} />)}
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="dex-dialog col-span-full p-6 text-center font-pixel text-[0.7rem] uppercase">
            No entries found. Try another search.
          </div>
        )}
      </div>
    </section>
  );
}

function DetailView({
  poke, loading, onClose, onPrev, onNext,
}: { poke: Poke; loading: boolean; onClose: () => void; onPrev: () => void; onNext: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[oklch(0.1_0.02_250/0.75)] p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="panel-lg relative max-h-[92vh] w-full max-w-3xl overflow-y-auto bg-[var(--dex-red)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b-[3px] border-[var(--dex-outline)] bg-[var(--dex-red-deep)] px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="led-blink h-3 w-3 shrink-0 rounded-full border-2 border-[var(--dex-outline)] bg-[var(--dex-yellow)]" />
            <span className="font-pixel truncate text-[0.6rem] uppercase text-[oklch(0.98_0.01_90)]">
              Dex Entry · {loading ? "Loading..." : "Loaded"}
            </span>
          </div>
          <button onClick={onClose} className="chunk-btn" style={{ padding: "0.35rem 0.6rem", fontSize: "0.55rem" }}>
            ✕ Close
          </button>
        </div>

        <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
          <div className="flex flex-col gap-3">
            <div className="panel bg-[var(--dex-outline)] p-3">
              <Sprite p={poke} size="lg" />
            </div>
            <div className="dex-dialog space-y-1 p-3">
              <div className="flex items-center justify-between font-pixel text-[0.55rem] uppercase">
                <span>№{String(poke.id).padStart(3, "0")}</span>
                <span>Gen {poke.gen}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-pixel text-[0.55rem] uppercase">HT</span>
                <span className="font-pixel text-[0.7rem]">{poke.height || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-pixel text-[0.55rem] uppercase">WT</span>
                <span className="font-pixel text-[0.7rem]">{poke.weight || "—"}</span>
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            <div>
              <p className="font-pixel text-[0.55rem] uppercase text-[oklch(0.98_0.01_90/0.8)]">
                {poke.species} Pokémon
              </p>
              <h3 className="mt-1 font-pixel text-2xl uppercase text-[oklch(0.98_0.01_90)] sm:text-3xl">
                {poke.name}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {poke.types.map((t) => <TypeBadge key={t} t={t} />)}
              </div>
            </div>

            <div className="panel space-y-2 p-4">
              <h4 className="font-pixel text-[0.6rem] uppercase text-muted-foreground">Base Stats</h4>
              <StatBar label="HP" value={poke.stats.hp} />
              <StatBar label="ATK" value={poke.stats.atk} />
              <StatBar label="DEF" value={poke.stats.def} />
              <StatBar label="SP.A" value={poke.stats.spa} />
              <StatBar label="SP.D" value={poke.stats.spd} />
              <StatBar label="SPD" value={poke.stats.spe} />
            </div>

            <div className="dex-dialog p-4">
              <p className="font-pixel text-[0.55rem] uppercase text-[oklch(0.4_0.08_25)]">▸ Pokédex Entry</p>
              <p className="mt-2 text-[0.85rem] leading-relaxed text-[var(--dex-dialog-foreground)]">
                {loading ? "Loading entry..." : poke.desc}
              </p>
              <div className="mt-3 flex justify-end">
                <span className="led-blink font-pixel text-[0.75rem] text-[var(--dex-outline)]">▼</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t-[3px] border-[var(--dex-outline)] bg-[var(--dex-red-deep)] px-4 py-3">
          <button onClick={onPrev} className="chunk-btn" style={{ padding: "0.45rem 0.7rem", fontSize: "0.55rem" }}>
            ◀ Prev
          </button>
          <span className="truncate text-center font-pixel text-[0.55rem] uppercase text-[oklch(0.98_0.01_90/0.85)]">
            Turn the page
          </span>
          <button onClick={onNext} className="chunk-btn" style={{ padding: "0.45rem 0.7rem", fontSize: "0.55rem" }}>
            Next ▶
          </button>
        </div>
      </div>
    </div>
  );
}

type ChatMsg = { from: "oak" | "you"; text: string };

const INITIAL_CHAT: ChatMsg[] = [
  { from: "oak", text: "Hello there! Welcome to the world of RETRODEX. My name is OAK — people call me the Pokémon Professor. Ask me about any Kanto, Johto, or Hoenn Pokémon!" },
];

function ChatDrawer({
  open, onClose, messages, onSend, sending, wakingUp,
}: {
  open: boolean;
  onClose: () => void;
  messages: ChatMsg[];
  onSend: (text: string) => void;
  sending: boolean;
  wakingUp: boolean;
}) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    const text = input.trim();
    if (!text || sending) return;
    onSend(text);
    setInput("");
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-[oklch(0.1_0.02_250/0.55)] transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-2xl px-3 pb-3 transition-transform duration-300 sm:px-6 sm:pb-6 ${open ? "translate-y-0" : "translate-y-[110%]"}`}
      >
        <div className="panel-lg overflow-hidden bg-[var(--dex-blue-deep)]">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b-[3px] border-[var(--dex-outline)] bg-[var(--dex-blue)] px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-[3px] border-[var(--dex-outline)] bg-[var(--dex-blue-deep)]">
                <FlaskIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-pixel text-[0.7rem] uppercase text-[oklch(0.98_0.01_90)]">Prof. Oak</p>
                <p className="truncate font-pixel text-[0.5rem] uppercase text-[oklch(0.98_0.01_90/0.7)]">
                  <span className="led-blink inline-block h-2 w-2 rounded-full bg-[oklch(0.7_0.17_145)] align-middle" /> Online · Handheld link
                </p>
              </div>
            </div>
            <button onClick={onClose} className="chunk-btn" style={{ padding: "0.35rem 0.6rem", fontSize: "0.55rem" }}>✕</button>
          </div>

          <div className="max-h-[55vh] space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "you" ? "justify-end" : "justify-start"}`}>
                <div className={`${m.from === "oak" ? "dex-dialog" : "panel bg-[var(--dex-red)] text-[oklch(0.98_0.01_90)]"} max-w-[85%] p-3`}>
                  <p className="font-pixel text-[0.5rem] uppercase opacity-70">
                    {m.from === "oak" ? "▸ Professor Oak" : "▸ You"}
                  </p>
                  <p className="mt-1.5 text-[0.85rem] leading-relaxed">{m.text}</p>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="dex-dialog max-w-[85%] p-3">
                  <p className="font-pixel text-[0.5rem] uppercase opacity-70">▸ Professor Oak</p>
                  <p className="mt-1.5 text-[0.85rem] leading-relaxed">
                    {wakingUp ? "The lab equipment is warming up, one moment..." : "Hmm, let me check my notes..."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t-[3px] border-[var(--dex-outline)] bg-[var(--dex-blue-deep)] p-3">
            <label className="flex min-w-0 items-center gap-2 rounded-xl border-[3px] border-[var(--dex-outline)] bg-[var(--dex-dialog)] px-3 py-2 shadow-[inset_0_0_0_3px_oklch(0.85_0.05_60)]">
              <span className="font-pixel text-[0.55rem] uppercase text-[var(--dex-outline)]">Say</span>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                placeholder="Type a reply..."
                disabled={sending}
                className="min-w-0 flex-1 bg-transparent text-[0.85rem] text-[var(--dex-outline)] placeholder:text-[oklch(0.22_0.03_250/0.4)] focus:outline-none"
              />
              <span className="led-blink font-pixel text-[0.7rem] text-[var(--dex-outline)]">▮</span>
            </label>
            <button onClick={handleSend} disabled={sending} className="chunk-btn chunk-btn-red">
              {sending ? "..." : "Send ▶"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default function Index() {
  const [booted, setBooted] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<PokeType | "all">("all");
  const [genFilter, setGenFilter] = useState<1 | 2 | 3 | "all">("all");
  const [openId, setOpenId] = useState<number | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>(INITIAL_CHAT);
const [chatSending, setChatSending] = useState(false);
const [wakingUp, setWakingUp] = useState(false);
const handleSendChat = async (text: string) => {
  const updated = [...chatMessages, { from: "you" as const, text }];
  setChatMessages(updated);
  setChatSending(true);
  try {
    const history: ChatMessage[] = chatMessages.map((m) => ({
      role: m.from === "you" ? "user" : "assistant",
      content: m.text,
    }));
    const reply = await sendChatMessage(text, history);
    setChatMessages((prev) => [...prev, { from: "oak", text: reply }]);
  } catch {
    setChatMessages((prev) => [...prev, { from: "oak", text: "Oh dear, my equipment seems to be malfunctioning. Try again in a moment?" }]);
  } finally {
    setChatSending(false);
  }
};
  const [dex, setDex] = useState<Poke[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [detailCache, setDetailCache] = useState<Record<number, Poke>>({});
  const [detailLoading, setDetailLoading] = useState(false);

  // Fetch the full dex list once, on mount.
  useEffect(() => {
    fetchPokemonList()
      .then((data) => setDex(data))
      .catch((err) => setListError(err.message))
      .finally(() => setListLoading(false));
  }, []);

  // Fetch full detail (stats/description/height/weight) whenever a new entry is opened.
  useEffect(() => {
    if (openId == null || detailCache[openId]) return;
    setDetailLoading(true);
    fetchPokemonDetail(openId)
      .then((data) => setDetailCache((prev) => ({ ...prev, [openId]: data })))
      .catch((err) => setListError(err.message))
      .finally(() => setDetailLoading(false));
  }, [openId, detailCache]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dex.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !String(p.id).includes(q)) return false;
      if (typeFilter !== "all" && !p.types.includes(typeFilter)) return false;
      if (genFilter !== "all" && p.gen !== genFilter) return false;
      return true;
    });
  }, [query, typeFilter, genFilter, dex]);

  // Prefer the fully-loaded detail if we have it; otherwise fall back to the
  // list-item version (has name/sprite/types, missing stats/desc) so the modal
  // can render immediately while the detail fetch is in flight.
  const openPokeBase = openId != null ? dex.find((p) => p.id === openId) ?? null : null;
  const openPoke = openId != null ? detailCache[openId] ?? openPokeBase : null;

  const flip = (dir: 1 | -1) => {
    if (openId == null || dex.length === 0) return;
    const idx = dex.findIndex((p) => p.id === openId);
    const next = (idx + dir + dex.length) % dex.length;
    setOpenId(dex[next].id);
  };

  if (!booted) return <BootScreen onEnter={() => setBooted(true)} />;

  if (listLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="font-pixel text-sm uppercase text-muted-foreground">Loading Pokédex data...</p>
      </main>
    );
  }

  if (listError) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="dex-dialog max-w-md p-6 text-center">
          <p className="font-pixel text-[0.7rem] uppercase">Couldn&apos;t reach the Dex API</p>
          <p className="mt-2 text-sm">{listError}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Check that the backend is running and NEXT_PUBLIC_API_URL is set correctly.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative">
      <DexList
        query={query} setQuery={setQuery}
        typeFilter={typeFilter} setTypeFilter={setTypeFilter}
        genFilter={genFilter} setGenFilter={setGenFilter}
        filtered={filtered}
        onOpen={(id) => setOpenId(id)}
        onOpenChat={() => setChatOpen(true)}
      />

      <button
        onClick={() => setChatOpen(true)}
        className="chunk-btn chunk-btn-blue fixed bottom-5 right-5 z-20 sm:hidden"
        aria-label="Open chat"
      >
        💬
      </button>

      {openPoke && (
        <DetailView
          poke={openPoke}
          loading={detailLoading && !detailCache[openPoke.id]}
          onClose={() => setOpenId(null)}
          onPrev={() => flip(-1)}
          onNext={() => flip(1)}
        />
      )}

      <ChatDrawer
  open={chatOpen}
  onClose={() => setChatOpen(false)}
  messages={chatMessages}
  onSend={handleSendChat}
  sending={chatSending}
  wakingUp={wakingUp}
/>

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-4 text-center font-pixel text-[0.5rem] uppercase text-muted-foreground">
        RetroDex · A fan homage · Not affiliated with Nintendo / Game Freak
      </footer>
    </main>
  );
}
