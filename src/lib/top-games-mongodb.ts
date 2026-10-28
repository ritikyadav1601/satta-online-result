import { ObjectId } from "mongodb";
import { getISTDateString } from "./utils";
import { getTopGamesDatabase } from "./top-games-database";
import type { ChartRow, GameChartData, MonthlyChartData, SK24Game } from "./types";

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

// Month-wise chart for a "top games" board entry (Sadar Bazar, Gwalior,
// Delhi Bazar, Delhi Matka, Shri Ganesh, Agra, Alwar, Dwarka, etc.).
//
// These games only exist in this MongoDB (added via topGameDefinitions);
// they have no MongoDB chart cache and no page on the third-party sites
// /api/game-chart falls back to scraping, so their /chart/[gameCode] page
// had nothing to show. getTopGamesFromMongoDB() above only ever reads
// yesterday/today for the homepage widget, but `gameresults` holds a full
// per-date history for every game here -- this reads a whole month of it.
export async function getTopGameChartFromMongoDB(
  gameCode: string,
  monthName?: string,
  yearStr?: string,
): Promise<GameChartData | null> {
  const definition = topGameDefinitions.find((def) =>
    [def.name, ...def.aliases].some((n) => normalizeName(n) === normalizeName(gameCode)),
  );
  if (!definition) return null;

  const database = await getTopGamesDatabase();
  const games = await database
    .collection<GameDocument>("games")
    .find({ isActive: { $ne: false } })
    .toArray();

  const gamesByName = new Map(games.map((game) => [normalizeName(String(game.name || "")), game]));
  const match = definition.aliases
    .map(normalizeName)
    .map((alias) => gamesByName.get(alias))
    .find(Boolean);
  if (!match) return null;

  const monthNames = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
  ];
  const now = new Date();
  const parsedMonthIndex = monthName ? monthNames.indexOf(monthName.toLowerCase()) : -1;
  const monthIndex = parsedMonthIndex >= 0 ? parsedMonthIndex : now.getMonth();
  const year = yearStr ? parseInt(yearStr, 10) : now.getFullYear();

  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  const startStr = `${year}-${pad(monthIndex + 1)}-01`;
  const endStr = `${year}-${pad(monthIndex + 1)}-${pad(daysInMonth)}`;

  const monthResults = await database
    .collection<ResultDocument>("gameresults")
    .find({ game: match._id, resultDate: { $gte: startStr, $lte: endStr } })
    .toArray();

  const resultByDate = new Map(monthResults.map((r) => [r.resultDate, r]));
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const results = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateObj = new Date(year, monthIndex, day);
    const dateStr = `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
    return {
      date: pad(day),
      day: dayNames[dateObj.getDay()],
      result: cleanResult(resultByDate.get(dateStr)?.result),
    };
  });

  const monthTitle = monthNames[monthIndex].charAt(0).toUpperCase() + monthNames[monthIndex].slice(1);

  return {
    gameName: definition.name,
    chartTitle: `${definition.name} - ${monthTitle} ${year}`,
    month: monthTitle,
    year: String(year),
    columns: ["Date", "Day", "Result"],
    results,
    scrapedAt: Date.now(),
  };
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
