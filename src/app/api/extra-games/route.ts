import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/khaiwal-admin-auth";
import { getISTDateString } from "@/lib/utils";
import {
  EXTRA_GAME_KEYS,
  getExtraGamesDocument,
  isExtraGameKey,
  listExtraGamesDocuments,
  saveExtraGameResult,
} from "@/lib/extra-games-mongodb";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// GET ?date=YYYY-MM-DD           -> results for one date
// GET ?month=11&year=2026        -> every saved row for that month (admin list)
export async function GET(req: NextRequest) {
  try {
    const params = new URL(req.url).searchParams;
    if (params.get("month")) {
      const month = parseInt(params.get("month") || "1", 10);
      const year = parseInt(params.get("year") || String(new Date().getFullYear()), 10);
      const prefix = `${year}-${String(month).padStart(2, "0")}`;
      const days = new Date(year, month, 0).getDate();
      const docs = await listExtraGamesDocuments(`${prefix}-01`, `${prefix}-${days}`);
      const rows = docs.map((doc) => ({
        date: doc._id,
        ...Object.fromEntries(EXTRA_GAME_KEYS.map((key) => [key, doc[key] || ""])),
      }));
      return Response.json({ success: true, rows });
    }
    const date = params.get("date") || getISTDateString(0);
    if (!DATE_RE.test(date)) return Response.json({ success: false, error: "Invalid date" }, { status: 400 });
    const doc = await getExtraGamesDocument(date);
    const games = Object.fromEntries(EXTRA_GAME_KEYS.map((key) => [key, doc?.[key] || ""]));
    return Response.json({ success: true, date, games });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// PUT { date, games: { shivpuri: "45", janakpuri: "" } } (admin only)
export async function PUT(req: NextRequest) {
  try {
    if (!(await getAdminSession())) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { date, games } = await req.json();
    if (!DATE_RE.test(String(date || ""))) return Response.json({ success: false, error: "Invalid date" }, { status: 400 });
    const entries = Object.entries((games || {}) as Record<string, unknown>).filter(([key]) => isExtraGameKey(key));
    if (!entries.length) return Response.json({ success: false, error: "No game values sent" }, { status: 400 });
    let doc = null;
    for (const [key, value] of entries) {
      doc = await saveExtraGameResult(date, key as (typeof EXTRA_GAME_KEYS)[number], value);
    }
    const saved = Object.fromEntries(EXTRA_GAME_KEYS.map((key) => [key, doc?.[key] || ""]));
    return Response.json({ success: true, date, games: saved });
  } catch (error) {
    const message = (error as Error).message;
    const status = message.startsWith("Result must") ? 400 : 500;
    return Response.json({ success: false, error: message }, { status });
  }
}
