import { getAdminSession } from "@/lib/khaiwal-admin-auth";
import { getKhaiwalSettings, saveKhaiwalSettings } from "@/lib/khaiwal-mongodb";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  return Response.json({ success: true, siteId: session.siteId, settings: await getKhaiwalSettings(session.siteId) });
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { name, whatsapp } = await request.json();
  if (!String(name || "").trim()) return Response.json({ success: false, error: "Name is required" }, { status: 400 });
  if (!/^\+?\d{8,15}$/.test(String(whatsapp || "").replace(/[\s-]/g, ""))) {
    return Response.json({ success: false, error: "Enter a valid WhatsApp number" }, { status: 400 });
  }
  const settings = await saveKhaiwalSettings({ name, whatsapp }, session.siteId);
  return Response.json({ success: true, siteId: session.siteId, settings });
}
