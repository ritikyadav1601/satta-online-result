import { getAdminSession } from "@/lib/khaiwal-admin-auth";

export async function GET() {
  const session = await getAdminSession();
  return Response.json(session
    ? { authenticated: true, siteId: session.siteId, loginId: session.loginId }
    : { authenticated: false }, { status: session ? 200 : 401 });
}
