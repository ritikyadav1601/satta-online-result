import {
  getHomepageFromMongoDB,
  getSK24GamesFromMongoDB,
  getSK24ChartsFromMongoDB,
} from "./mongodb-cache";
import { getCustomGamesDocument } from "./custom-games-mongodb";
import { EXTRA_GAMES, getExtraGamesDocument } from "./extra-games-mongodb";
import { getISTDateString } from "./utils";
import { getKhaiwalSettings } from "./khaiwal-mongodb";
import { getTopGamesFromMongoDB } from "./top-games-mongodb";
import { getMonthlyChartFromTopGames } from "./top-games-mongodb";
import type {
  GameResult,
  ChartRow,
  SK24Game,
  SK24ChartTable,
} from "./types";

export interface HomeData {
  liveResults: GameResult[];
  nextResults: GameResult[];
  restResults: GameResult[];
  sk24Games: SK24Game[];
  sk24Charts: SK24ChartTable[];
  monthlyChart: ChartRow[];
  monthlyChartMeta: { month: string; year: string };
  customGames: Record<string, string>;
  customGamesYesterday: Record<string, string>;
  khaiwal: { name: string; whatsapp: string } | null;
  topGames: SK24Game[];
  extraGames: SK24Game[];
}

// Read today's custom game values + khaiwal directly from MongoDB (server-side).
async function getCustomGamesForDate(date: string) {
  try {
    const d = await getCustomGamesDocument(date);
    if (!d) return { games: {} as Record<string, string>, khaiwal: null };
    return {
      games: {
        kohlapur: d.kohlapur || "",
        manipur: d.manipur || "",
        "up-bazar": d["up-bazar"] || "",
        "palwal-city": d["palwal-city"] || "",
        "mathura-city": d["mathura-city"] || "",
      } as Record<string, string>,
      khaiwal: d.khaiwal
        ? { name: String(d.khaiwal.name || ""), whatsapp: String(d.khaiwal.whatsapp || "") }
        : null,
    };
  } catch (err) {
    console.warn("[home-data] custom games read failed:", (err as Error).message);
    return { games: {} as Record<string, string>, khaiwal: null };
  }
}

// Shivpuri / Janakpuri: admin-entered results (today + yesterday, IST).
async function getExtraGames(today: string, yesterday: string): Promise<SK24Game[]> {
  try {
    const [todayDoc, yesterdayDoc] = await Promise.all([
      getExtraGamesDocument(today),
      getExtraGamesDocument(yesterday),
    ]);
    return EXTRA_GAMES.map((game) => ({
      name: game.name,
      time: game.time,
      yesterday: yesterdayDoc?.[game.key] || "XX",
      today: todayDoc?.[game.key] || "XX",
      updatedAt: todayDoc?.[`${game.key}UpdatedAt`] || null,
    }));
  } catch (err) {
    console.warn("[home-data] extra games read failed:", (err as Error).message);
    return EXTRA_GAMES.map((game) => ({ name: game.name, time: game.time, yesterday: "XX", today: "XX" }));
  }
}

// Fetch everything the homepage needs, in parallel, from MongoDB (no scraping).
export async function getHomeData(): Promise<HomeData> {
  const now = new Date();
  const monthName = now.toLocaleString("en-US", { month: "long" }).toLowerCase();
  const year = now.getFullYear().toString();
  // Use IST so results roll over at midnight IST, not midnight UTC.
  const today = getISTDateString(0);
  const yesterday = getISTDateString(-1);

  const [homepage, sk24, sk24chart, chart, custom, customPrev, khaiwal, topGames, extraGames] = await Promise.all([
    getHomepageFromMongoDB(),
    getSK24GamesFromMongoDB(),
    getSK24ChartsFromMongoDB(),
    getMonthlyChartFromTopGames(monthName, year),
    getCustomGamesForDate(today),
    getCustomGamesForDate(yesterday),
    getKhaiwalSettings().catch(() => null),
    getTopGamesFromMongoDB().catch((error) => {
      console.error("[home-data] top games MongoDB read failed:", (error as Error).message);
      return [];
    }),
    getExtraGames(today, yesterday),
  ]);

  const response: HomeData = {
    liveResults: homepage?.live || [],
    nextResults: homepage?.next || [],
    restResults: homepage?.rest || [],
    sk24Games: sk24?.games || [],
    sk24Charts: sk24chart?.tables || [],
    monthlyChart: chart?.results || [],
    monthlyChartMeta: {
      month: chart?.month || monthName,
      year: chart?.year || year,
    },
    customGames: custom.games || {},
    customGamesYesterday: customPrev.games || {},
    khaiwal: khaiwal || custom.khaiwal || null,
    topGames,
    extraGames,
  };
  return response;
}
