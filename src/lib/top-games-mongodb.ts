import { ObjectId } from "mongodb";
import { getISTDateString } from "./utils";
import { getTopGamesDatabase } from "./top-games-database";
import type { ChartRow, MonthlyChartData, SK24Game } from "./types";

const topGameDefinitions = [
  { name: "SADAR BAZAR", time: "01:39 PM", aliases: ["sadar bazar"] },
  { name: "GWALIOR", time: "02:39 PM", aliases: ["gwalior"] },
  { name: "DELHI BAZAR", time: "03:00 PM", aliases: ["delhi bazar"] },
  { name: "DELHI MATKA", time: "03:39 PM", aliases: ["delhi matka"] },
  { name: "SHRI GANESH", time: "04:30 PM", aliases: ["shri ganesh"] },
  { name: "AGRA", time: "05:29 PM", aliases: ["agra"] },
  { name: "FARIDABAD", time: "06:00 PM", aliases: ["faridabad", "fridabad"] },
  { name: "ALWAR", time: "07:34 PM", aliases: ["alwar"] },
  { name: "GAZIABAD", time: "09:25 PM", aliases: ["gaziabad", "ghaziabad"] },
  { name: "DWARKA", time: "10:34 PM", aliases: ["dwarka"] },
  { name: "GALI", time: "11:25 PM", aliases: ["gali"] },
  { name: "DESAWAR", time: "05:00 AM", aliases: ["desawar", "desawer"] },
] as const;

type GameDocument = {
  _id: ObjectId;
  name?: string;
  isActive?: boolean;
};

type ResultDocument = {
  game?: ObjectId | string;
  resultDate?: string;
  result?: string | number;
  updatedAt?: Date | string | number;
};

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function cleanResult(value: unknown) {
  const result = String(value ?? "").trim();
  return /^\d{1,2}$/.test(result) ? result.padStart(2, "0") : "XX";
}

function currentIstMinutes(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return Number(values.hour) * 60 + Number(values.minute);
}

export async function getTopGamesFromMongoDB(): Promise<SK24Game[]> {
  const database = await getTopGamesDatabase();
  const games = await database
    .collection<GameDocument>("games")
    .find({ isActive: { $ne: false } })
    .toArray();

  const gamesByName = new Map(games.map((game) => [normalizeName(String(game.name || "")), game]));
  const selectedGames = topGameDefinitions.map((definition) => ({
    definition,
    game: definition.aliases
      .map(normalizeName)
      .map((alias) => gamesByName.get(alias))
      .find(Boolean),
  }));
  const gameIds = selectedGames.flatMap(({ game }) => (game ? [game._id] : []));
  // Match the source site's result board: the previous day's board remains
  // active until 03:00 IST so late-night/early-morning games stay together.
  const boardOffset = currentIstMinutes() < 180 ? -1 : 0;
  const today = getISTDateString(boardOffset);
  const yesterday = getISTDateString(boardOffset - 1);
  const results = gameIds.length
    ? await database
        .collection<ResultDocument>("gameresults")
        .find({ game: { $in: gameIds }, resultDate: { $in: [yesterday, today] } })
        .sort({ updatedAt: 1 })
        .toArray()
    : [];

  const resultByGameAndDate = new Map(
    results.map((result) => [
      `${String(result.game)}:${result.resultDate}`,
      result,
    ]),
  );

  const response = selectedGames.map(({ definition, game }) => {
    const previousResult = game
      ? resultByGameAndDate.get(`${String(game._id)}:${yesterday}`)
      : undefined;
    const currentResult = game
      ? resultByGameAndDate.get(`${String(game._id)}:${today}`)
      : undefined;

    return {
      name: definition.name,
      time: definition.time,
      yesterday: cleanResult(previousResult?.result),
      today: cleanResult(currentResult?.result),
      updatedAt: currentResult?.updatedAt
        ? new Date(currentResult.updatedAt).toISOString()
        : null,
    };
  });
  return response;
}

const monthlyGameDefinitions = [
  { key: "dlbz", aliases: ["delhi bazar"] },
  { key: "srgn", aliases: ["shri ganesh"] },
  { key: "frbd", aliases: ["faridabad", "fridabad"] },
  { key: "gzbd", aliases: ["gaziabad", "ghaziabad"] },
  { key: "gali", aliases: ["gali"] },
  { key: "dswr", aliases: ["desawar", "desawer", "disawar"] },
] as const;

export async function getMonthlyChartFromTopGames(
  monthName: string,
  year: string,
): Promise<MonthlyChartData> {
  const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
  if (Number.isNaN(monthIndex)) throw new Error("Invalid month.");

  const database = await getTopGamesDatabase();
  const games = await database
    .collection<GameDocument>("games")
    .find({ isActive: { $ne: false } })
    .toArray();
  const byName = new Map(games.map((game) => [normalizeName(String(game.name || "")), game]));
  const selected = monthlyGameDefinitions.map((definition) => ({
    definition,
    game: definition.aliases.map(normalizeName).map((alias) => byName.get(alias)).find(Boolean),
  }));
  const ids = selected.flatMap(({ game }) => game ? [game._id] : []);
  const month = String(monthIndex + 1).padStart(2, "0");
  const daysInMonth = new Date(Number(year), monthIndex + 1, 0).getDate();
  const todayIst = getISTDateString();
  const selectedMonthKey = `${year}-${month}`;
  const currentMonthKey = todayIst.slice(0, 7);
  // Past months show their complete history. The current month stops at today,
  // and a future month has no result rows yet.
  const visibleDays =
    selectedMonthKey < currentMonthKey
      ? daysInMonth
      : selectedMonthKey === currentMonthKey
        ? Number(todayIst.slice(8, 10))
        : 0;
  const start = `${year}-${month}-01`;
  const end = `${year}-${month}-${String(visibleDays).padStart(2, "0")}`;
  const results = ids.length
    ? await database.collection<ResultDocument>("gameresults")
        .find({ game: { $in: ids }, resultDate: { $gte: start, $lte: end } })
        .sort({ updatedAt: 1 })
        .toArray()
    : [];
  const resultMap = new Map(results.map((result) => [`${String(result.game)}:${result.resultDate}`, cleanResult(result.result)]));

  const rows: ChartRow[] = Array.from({ length: visibleDays }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    const resultDate = `${year}-${month}-${day}`;
    const row: ChartRow = { date: day, dlbz: "XX", srgn: "XX", frbd: "XX", gzbd: "XX", gali: "XX", dswr: "XX" };
    selected.forEach(({ definition, game }) => {
      if (game) row[definition.key] = resultMap.get(`${String(game._id)}:${resultDate}`) || "XX";
    });
    return row;
  });

  const response = { month: monthName, year, results: rows, scrapedAt: Date.now() };
  return response;
}
