import { authenticateAdmin, createAdminSession } from "@/lib/khaiwal-admin-auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const admin = await authenticateAdmin(email, password);
    if (!admin) return Response.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    await createAdminSession(admin);
    return Response.json({ success: true, siteId: admin.siteId, loginId: admin.loginId, permissions: admin.permissions });
  } catch (error) {
    console.warn("[admin-login] Unable to sign in:", (error as Error).message);
    return Response.json({
      success: false,
      error: process.env.NODE_ENV === "development" ? (error as Error).message : "Unable to sign in",
    }, { status: 500 });
  }
}
