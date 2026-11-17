import { getAdminSession } from "@/lib/khaiwal-admin-auth";
import { getISTDateString } from "@/lib/utils";
import { seedExtraGamesHistory } from "@/lib/extra-games-mongodb";

// Admin only: fills random 2-digit results for the last 365 days wherever a
// day has no value yet. Safe to run more than once (never overwrites).
export async function POST() {
  try {
    if (!(await getAdminSession())) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const summary = await seedExtraGamesHistory(getISTDateString(0), 365);
    return Response.json({ success: true, ...summary });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
