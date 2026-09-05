import { destroyAdminSession } from "@/lib/khaiwal-admin-auth";

export async function POST() {
  await destroyAdminSession();
  return Response.json({ success: true });
}
