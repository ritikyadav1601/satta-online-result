import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getKhaiwalDatabase } from "./khaiwal-mongodb";

const COOKIE_NAME = "khaiwal_admin_session";
const SESSION_DAYS = 7;

type AdminUser = {
  siteId?: string;
  loginId?: string;
  passwordHash?: string;
  passwordSalt?: string;
  active?: boolean;
  permissions?: string[];
};

type AdminSession = {
  tokenHash: string;
  siteId: string;
  loginId: string;
  expiresAt: Date;
};

export async function authenticateAdmin(loginId: string, password: string) {
  const normalizedLogin = String(loginId || "").trim().toLowerCase();
  const admin = await (await getKhaiwalDatabase())
    .collection<AdminUser>("admin_users")
    .findOne({ loginId: normalizedLogin, active: { $ne: false } });
  if (!admin?.siteId || !admin.passwordHash || !admin.passwordSalt) return null;

  const calculated = scryptSync(password, admin.passwordSalt, 64);
  const stored = Buffer.from(admin.passwordHash, "hex");
  if (stored.length !== calculated.length || !timingSafeEqual(stored, calculated)) return null;
  return { siteId: admin.siteId, loginId: normalizedLogin, permissions: admin.permissions || [] };
}

export async function createAdminSession(admin: { siteId: string; loginId: string }) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await (await getKhaiwalDatabase()).collection<AdminSession>("admin_sessions").insertOne({
    tokenHash: hashToken(token), siteId: admin.siteId, loginId: admin.loginId, expiresAt,
  });
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: expiresAt,
  });
}

export async function getAdminSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  return (await getKhaiwalDatabase()).collection<AdminSession>("admin_sessions").findOne({
    tokenHash: hashToken(token), expiresAt: { $gt: new Date() },
  });
}

export async function destroyAdminSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) await (await getKhaiwalDatabase()).collection("admin_sessions").deleteOne({ tokenHash: hashToken(token) });
  store.delete(COOKIE_NAME);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
