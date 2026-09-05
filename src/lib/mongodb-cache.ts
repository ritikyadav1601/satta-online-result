import type {
  HomepageData,
  MonthlyChartData,
  GameChartData,
  SK24GamesData,
  SK24ChartsData,
} from "./types";
import { getExternalGameDatabase } from "./external-game-mongodb";
import { getTopGamesDatabase } from "./top-games-database";
import { ObjectId } from "mongodb";
import { getISTDateString } from "./utils";

const COLLECTION = "scraped_cache";

type CacheDocument = { _id: string } & Record<string, unknown>;

async function getCacheDocument(id: string, source: "external" | "top" = "external"): Promise<CacheDocument | null> {
  try {
    const database = source === "top" ? await getTopGamesDatabase() : await getExternalGameDatabase();
    const response = await database
      .collection<CacheDocument>(COLLECTION)
      .findOne({ _id: id });
    return response;
  } catch (error) {
    console.warn(`[mongodb-cache] Failed to read ${id}:`, (error as Error).message);
    return null;
  }
}

export async function getHomepageFromMongoDB(): Promise<HomepageData | null> {
  try {
    const database = await getExternalGameDatabase();
    const games = await database.collection<{
      _id: ObjectId; name?: string; resultTime?: string; isActive?: boolean; showIndex?: number;
    }>("games").find({ isActive: { $ne: false } }).sort({ showIndex: 1 }).toArray();
    const today = getISTDateString();
    const yesterday = getISTDateString(-1);
    const results = games.length
      ? await database.collection<{
          game?: ObjectId; resultDate?: string; result?: string | number;
        }>("gameresults").find({
          game: { $in: games.map((game) => game._id) },
          resultDate: { $in: [yesterday, today] },
        }).toArray()
      : [];
    const values = new Map(results.map((result) => [`${String(result.game)}:${result.resultDate}`, String(result.result ?? "XX").padStart(2, "0")]));
    const externalGames = games.map((game) => ({
      name: String(game.name || ""),
      time: formatResultTime(game.resultTime),
      yesterday: values.get(`${String(game._id)}:${yesterday}`) || "XX",
      today: values.get(`${String(game._id)}:${today}`) || "XX",
    }));
    return { live: [], next: [], rest: externalGames, scrapedAt: Date.now() };
  } catch (error) {
    console.warn("[mongodb-cache] Failed to read external games:", (error as Error).message);
    return null;
  }
}

function formatResultTime(value?: string) {
  if (!value) return "";
  const [hourText, minute = "00"] = value.split(":");
  const hour = Number(hourText);
  if (Number.isNaN(hour)) return value;
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
}

export async function getMonthlyChartFromMongoDB(month: string, year: string): Promise<MonthlyChartData | null> {
  const data = await getCacheDocument(`chart_${month.toLowerCase()}_${year}`, "top");
  if (!data) return null;
  return {
    month: String(data.month || month),
    year: String(data.year || year),
    results: (data.results as MonthlyChartData["results"]) || [],
    scrapedAt: Number(data.scrapedAt) || 0,
  };
}

export async function getGameChartFromMongoDB(
  slug: string,
  month?: string,
  year?: string,
): Promise<GameChartData | null> {
  const id = `game_${slug}_${(month || "current").toLowerCase()}_${year || "current"}`;
  const data = await getCacheDocument(id, "top");
  if (!data) return null;
  return {
    gameName: String(data.gameName || ""),
    chartTitle: String(data.chartTitle || ""),
    month: String(data.month || ""),
    year: String(data.year || ""),
    columns: (data.columns as string[]) || [],
    results: (data.results as GameChartData["results"]) || [],
    scrapedAt: Number(data.scrapedAt) || 0,
  };
}

export async function getSK24GamesFromMongoDB(): Promise<SK24GamesData | null> {
  const data = await getCacheDocument("sk24_games");
  if (!data) return null;
  return { games: (data.games as SK24GamesData["games"]) || [], scrapedAt: Number(data.scrapedAt) || 0 };
}

export async function getSK24ChartsFromMongoDB(): Promise<SK24ChartsData | null> {
  const data = await getCacheDocument("sk24_charts");
  if (!data) return null;
  return { tables: (data.tables as SK24ChartsData["tables"]) || [], scrapedAt: Number(data.scrapedAt) || 0 };
}
