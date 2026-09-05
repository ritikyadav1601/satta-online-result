import { NextRequest } from "next/server";
import { CUSTOM_GAME_KEYS, deleteCustomGame, getCustomGamesDocument, listCustomGamesDocuments, saveCustomGame, saveCustomGames } from "@/lib/custom-games-mongodb";
import { getKhaiwalSettings, saveKhaiwalSettings } from "@/lib/khaiwal-mongodb";
import { getAdminSession } from "@/lib/khaiwal-admin-auth";

async function requireAdmin() {
  return getAdminSession();
}

export async function GET(req: NextRequest) {
  try {
    const params = new URL(req.url).searchParams;
    if (params.get("list")) {
      const now = new Date();
      const month = parseInt(params.get("month") || String(now.getMonth() + 1));
      const year = parseInt(params.get("year") || String(now.getFullYear()));
      const prefix = `${year}-${String(month).padStart(2, "0")}`;
      const docs = await listCustomGamesDocuments(params.get("all") ? undefined : `${prefix}-01`, params.get("all") ? undefined : `${prefix}-${new Date(year, month, 0).getDate()}`);
      const entries = docs.flatMap((doc) => CUSTOM_GAME_KEYS.flatMap((game) => doc[game] != null && String(doc[game]).trim() ? [{ date: doc._id, game, value: String(doc[game]) }] : []));
      return Response.json({ success: true, entries });
    }
    const date = params.get("date") || new Date().toISOString().slice(0, 10);
    const [doc, mongoKhaiwal] = await Promise.all([getCustomGamesDocument(date), getKhaiwalSettings().catch(() => null)]);
    const games = Object.fromEntries(CUSTOM_GAME_KEYS.map((game) => [game, doc?.[game] || ""]));
    return Response.json({ success: true, games: doc ? games : {}, khaiwal: mongoKhaiwal || doc?.khaiwal || null });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { games, khaiwalName, whatsapp, khaiwal, date } = await req.json();
    const admin = await requireAdmin();
    if (!admin) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const existing = await getKhaiwalSettings(admin.siteId).catch(() => null);
    const hasKhaiwal = khaiwal != null || khaiwalName != null || whatsapp != null;
    const finalKhaiwal = !hasKhaiwal ? existing : khaiwal || { name: khaiwalName ?? existing?.name ?? "", whatsapp: whatsapp ?? existing?.whatsapp ?? "" };
    if (hasKhaiwal && finalKhaiwal) await saveKhaiwalSettings(finalKhaiwal, admin.siteId);
    const doc = await saveCustomGames(date || new Date().toISOString().slice(0, 10), games || {});
    return Response.json({ success: true, games: doc, khaiwal: finalKhaiwal });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { date, game, value } = await req.json();
    if (!(await requireAdmin())) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (!date || !game) return Response.json({ success: false, error: "date and game are required" }, { status: 400 });
    await saveCustomGame(date, game, value);
    return Response.json({ success: true });
  } catch (error) { return Response.json({ success: false, error: (error as Error).message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const { date, game } = await req.json();
    if (!(await requireAdmin())) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (!date || !game) return Response.json({ success: false, error: "date and game are required" }, { status: 400 });
    await deleteCustomGame(date, game);
    return Response.json({ success: true });
  } catch (error) { return Response.json({ success: false, error: (error as Error).message }, { status: 500 }); }
}
