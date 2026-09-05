import { NextRequest } from "next/server";
import { listCustomGamesDocuments } from "@/lib/custom-games-mongodb";

export async function GET(req: NextRequest) {
  const params = new URL(req.url).searchParams;
  const game = params.get("game");
  const month = parseInt(params.get("month") || String(new Date().getMonth() + 1));
  const year = parseInt(params.get("year") || String(new Date().getFullYear()));
  if (!game) return Response.json({ success: false, error: "game is required" }, { status: 400 });
  try {
    const days = new Date(year, month, 0).getDate();
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    const docs = await listCustomGamesDocuments(`${prefix}-01`, `${prefix}-${days}`);
    const values = new Map(docs.map((doc) => [doc._id, doc[game as keyof typeof doc]]));
    const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const results = Array.from({ length: days }, (_, index) => {
      const day = index + 1;
      const date = `${prefix}-${String(day).padStart(2, "0")}`;
      return { date: String(day).padStart(2, "0"), day: names[new Date(year, month - 1, day).getDay()], result: String(values.get(date) || "XX") };
    });
    const monthName = new Date(year, month - 1).toLocaleString("en-US", { month: "long" });
    const gameName = game.replace(/-/g, " ").toUpperCase();
    return Response.json({ success: true, gameName, chartTitle: `${gameName} - ${monthName} ${year}`, month: monthName, year: String(year), columns: ["Date", "Day", "Result"], results });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
