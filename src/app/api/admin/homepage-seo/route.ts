import { getAdminSession } from "@/lib/khaiwal-admin-auth";
import { getHomepageSeo, saveHomepageSeo } from "@/lib/homepage-seo";

export const dynamic = "force-dynamic";

// GET -> homepage SEO settings for the logged-in admin's site
export async function GET() {
  const session = await getAdminSession();
  if (!session) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  return Response.json({ success: true, siteId: session.siteId, seo: await getHomepageSeo(session.siteId) });
}

// PUT { seo } -> save homepage SEO settings
export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  try {
    const { seo } = await request.json();
    if (!seo || typeof seo !== "object") {
      return Response.json({ success: false, error: "seo object is required" }, { status: 400 });
    }
    return Response.json({ success: true, seo: await saveHomepageSeo(seo, session.siteId) });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
