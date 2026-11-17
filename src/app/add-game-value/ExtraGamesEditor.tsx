"use client";

import { useEffect, useState } from "react";
import { FiCalendar, FiCheck, FiEdit2, FiLoader, FiPlus, FiTrash2, FiX } from "react-icons/fi";

const GAMES = [
  { key: "shivpuri", name: "Shivpuri", time: "04:15 PM" },
  { key: "janakpuri", name: "Janakpuri", time: "08:15 PM" },
] as const;

type GameKey = (typeof GAMES)[number]["key"];
type Values = Record<GameKey, string>;

const EMPTY: Values = { shivpuri: "", janakpuri: "" };

function istToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function prettyDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

export default function ExtraGamesEditor({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [date, setDate] = useState(istToday);
  const [values, setValues] = useState<Values>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<GameKey | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<GameKey | null>(null);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    setLoading(true); setEditing(null); setMessage(null);
    fetch(`/api/extra-games?date=${date}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setValues({ ...EMPTY, ...(data.games || {}) }))
      .catch(() => setMessage({ text: "Could not load results for this date.", error: true }))
      .finally(() => setLoading(false));
  }, [date]);

  async function saveGame(game: GameKey, value: string) {
    setBusy(game); setMessage(null);
    try {
      const response = await fetch("/api/extra-games", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, games: { [game]: value } }),
      });
      if (response.status === 401) return onUnauthorized();
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save result");
      setValues({ ...EMPTY, ...data.games });
      setEditing(null);
      const name = GAMES.find((g) => g.key === game)?.name;
      setMessage({ text: value ? `${name} result saved.` : `${name} result removed.` });
    } catch (cause) {
      setMessage({ text: (cause as Error).message, error: true });
    } finally {
      setBusy(null);
    }
  }

  function startEdit(game: GameKey) {
    setEditing(game); setDraft(values[game]); setMessage(null);
  }

  function remove(game: GameKey) {
    const name = GAMES.find((g) => g.key === game)?.name;
    if (!confirm(`Remove ${name} result for ${date}?`)) return;
    saveGame(game, "");
  }

  return (
    <section className="mt-6 rounded-[28px] border-2 border-yellow-200 bg-white p-6 shadow-sm sm:p-10">
      <div>
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-amber-600">Result update</p>
          <h2 className="mt-1 text-2xl font-black">Shivpuri &amp; Janakpuri</h2>
          <p className="mt-2 text-sm text-slate-500">Select a date to add, edit or remove its results.</p>
        </div>
      </div>

      <label className="mt-7 block">
        <span className="mb-2 flex items-center gap-2 font-bold"><FiCalendar /> Result date</span>
        <input type="date" required value={date} max={istToday()} onChange={(e) => e.target.value && setDate(e.target.value)} className="min-h-14 w-full rounded-xl border border-slate-300 px-5 text-lg outline-none focus:border-amber-500 focus:ring-4 focus:ring-yellow-100" />
        <span className="mt-2 block text-sm font-bold text-slate-600">{prettyDate(date)}</span>
      </label>

      {loading ? (
        <div className="grid min-h-40 place-items-center"><FiLoader className="animate-spin text-2xl text-amber-600" /></div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {GAMES.map((game) => {
            const value = values[game.key];
            const isEditing = editing === game.key;
            const isBusy = busy === game.key;
            return (
              <div key={game.key} className="rounded-2xl border-2 border-yellow-200 bg-yellow-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black uppercase">{game.name}</p>
                    <p className="text-xs font-bold text-slate-500">Result time {game.time}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${value ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{value ? "Declared" : "Not declared"}</span>
                </div>

                {isEditing ? (
                  <form onSubmit={(event) => { event.preventDefault(); if (draft) saveGame(game.key, draft); }} className="mt-4">
                    <input
                      autoFocus
                      inputMode="numeric"
                      maxLength={2}
                      pattern="\d{1,2}"
                      required
                      placeholder="00"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 2))}
                      className="min-h-16 w-full rounded-xl border border-slate-300 bg-white px-5 text-center font-mono text-4xl font-black outline-none focus:border-amber-500 focus:ring-4 focus:ring-yellow-100"
                    />
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button disabled={isBusy || !draft} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-black font-black text-yellow-100 hover:bg-slate-800 disabled:opacity-60">{isBusy ? <FiLoader className="animate-spin" /> : <FiCheck />} Save</button>
                      <button type="button" onClick={() => setEditing(null)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white font-black hover:bg-slate-100"><FiX /> Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className={`my-4 text-center font-mono text-6xl font-black ${value ? "text-green-600" : "text-slate-300"}`}>{value || "XX"}</p>
                    <div className={`grid gap-2 ${value ? "grid-cols-2" : "grid-cols-1"}`}>
                      <button type="button" onClick={() => startEdit(game.key)} disabled={isBusy} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-black font-black text-yellow-100 hover:bg-slate-800 disabled:opacity-60">{value ? <><FiEdit2 /> Edit</> : <><FiPlus /> Add result</>}</button>
                      {value && <button type="button" onClick={() => remove(game.key)} disabled={isBusy} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-50 font-black text-red-700 hover:bg-red-100 disabled:opacity-60">{isBusy ? <FiLoader className="animate-spin" /> : <FiTrash2 />} Remove</button>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {message && <p role="status" className={`mt-5 rounded-xl px-4 py-3 text-sm font-bold ${message.error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{message.text}</p>}
    </section>
  );
}
