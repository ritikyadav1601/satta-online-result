import { getExternalGameDatabase } from "./external-game-mongodb";

// Admin-managed "extra" games shown at the top of the homepage
// "अन्य गेम रिजल्ट" section. One document per IST date (_id = YYYY-MM-DD).
export const EXTRA_GAMES = [
  { key: "shivpuri", name: "SHIVPURI", time: "04:15 PM" },
  { key: "janakpuri", name: "JANAKPURI", time: "08:15 PM" },
] as const;

export type ExtraGameKey = (typeof EXTRA_GAMES)[number]["key"];
export const EXTRA_GAME_KEYS = EXTRA_GAMES.map((game) => game.key) as ExtraGameKey[];

export type ExtraGamesDocument = {
  _id: string;
  updatedAt?: number;
} & Partial<Record<ExtraGameKey, string>> &
  Partial<Record<`${ExtraGameKey}UpdatedAt`, number>>;

export const EXTRA_GAMES_COLLECTION = "sattaonline_extra_games";

export function isExtraGameKey(value: string): value is ExtraGameKey {
  return EXTRA_GAME_KEYS.includes(value as ExtraGameKey);
}

export function cleanExtraResult(value: unknown) {
  const result = String(value ?? "").trim();
  if (!result) return "";
  if (!/^\d{1,2}$/.test(result)) throw new Error("Result must be a 1 or 2 digit number.");
  return result.padStart(2, "0");
}

function collection() {
  return getExternalGameDatabase().then((database) =>
    database.collection<ExtraGamesDocument>(EXTRA_GAMES_COLLECTION),
  );
}

export async function getExtraGamesDocument(date: string) {
  return (await collection()).findOne({ _id: date });
}

export async function listExtraGamesDocuments(start: string, end: string) {
  return (await collection()).find({ _id: { $gte: start, $lte: end } }).sort({ _id: -1 }).toArray();
}

// Save (or clear, when value is empty) a single game's result for a date.
export async function saveExtraGameResult(date: string, game: ExtraGameKey, value: unknown) {
  const result = cleanExtraResult(value);
  const now = Date.now();
  if (!result) {
    await (await collection()).updateOne(
      { _id: date },
      { $unset: { [game]: "", [`${game}UpdatedAt`]: "" }, $set: { updatedAt: now } },
    );
  } else {
    await (await collection()).updateOne(
      { _id: date },
      { $set: { [game]: result, [`${game}UpdatedAt`]: now, updatedAt: now } },
      { upsert: true },
    );
  }
  return getExtraGamesDocument(date);
}

function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

// Fill random 2-digit results for every missing day in the range
// [today - days, yesterday]. Existing values are never overwritten.
export async function seedExtraGamesHistory(today: string, days = 365) {
  const col = await collection();
  const start = shiftDate(today, -days);
  const end = shiftDate(today, -1);
  const existing = new Map((await listExtraGamesDocuments(start, end)).map((doc) => [doc._id, doc]));
  const operations = [];
  for (let offset = days; offset >= 1; offset -= 1) {
    const date = shiftDate(today, -offset);
    const doc = existing.get(date);
    const values: Record<string, string | number> = {};
    for (const key of EXTRA_GAME_KEYS) {
      if (!doc?.[key]) values[key] = String(Math.floor(Math.random() * 100)).padStart(2, "0");
    }
    if (Object.keys(values).length) {
      operations.push({ updateOne: { filter: { _id: date }, update: { $set: values }, upsert: true } });
    }
  }
  if (operations.length) await col.bulkWrite(operations, { ordered: false });
  return { start, end, filledDays: operations.length };
}
