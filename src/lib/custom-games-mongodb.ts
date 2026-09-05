import { getExternalGameDatabase } from "./external-game-mongodb";

export const CUSTOM_GAME_KEYS = ["kohlapur", "manipur", "up-bazar", "palwal-city", "mathura-city"] as const;

export type CustomGamesDocument = {
  _id: string;
  updatedAt?: number | Date;
  khaiwal?: { name?: string; whatsapp?: string } | null;
} & Partial<Record<(typeof CUSTOM_GAME_KEYS)[number], string>>;

function collection() {
  return getExternalGameDatabase().then((database) =>
    database.collection<CustomGamesDocument>("custom_games"),
  );
}

export async function getCustomGamesDocument(date: string) {
  const response = await (await collection()).findOne({ _id: date });
  return response;
}

export async function listCustomGamesDocuments(start?: string, end?: string) {
  const filter = start && end ? { _id: { $gte: start, $lte: end } } : {};
  const response = await (await collection()).find(filter).sort({ _id: -1 }).toArray();
  return response;
}

export async function saveCustomGames(date: string, games: Record<string, unknown>) {
  const values = Object.fromEntries(
    CUSTOM_GAME_KEYS.filter((key) => Object.prototype.hasOwnProperty.call(games, key))
      .map((key) => [key, String(games[key] ?? "").trim()]),
  );
  await (await collection()).updateOne(
    { _id: date },
    { $set: { ...values, updatedAt: Date.now() } },
    { upsert: true },
  );
  return getCustomGamesDocument(date);
}

export async function saveCustomGame(date: string, game: string, value: unknown) {
  if (!CUSTOM_GAME_KEYS.includes(game as (typeof CUSTOM_GAME_KEYS)[number])) {
    throw new Error("Unknown game.");
  }
  await (await collection()).updateOne(
    { _id: date },
    { $set: { [game]: String(value ?? "").trim(), updatedAt: Date.now() } },
    { upsert: true },
  );
}

export async function deleteCustomGame(date: string, game: string) {
  if (!CUSTOM_GAME_KEYS.includes(game as (typeof CUSTOM_GAME_KEYS)[number])) {
    throw new Error("Unknown game.");
  }
  await (await collection()).updateOne(
    { _id: date },
    { $unset: { [game]: "" }, $set: { updatedAt: Date.now() } },
  );
}
