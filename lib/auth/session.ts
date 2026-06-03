/* ============================================================
   Session helpers — httpOnly cookie sessions for customers + admin.
   ============================================================ */
import { cookies } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { signJwt, verifyJwt } from "./jwt";

const USER_COOKIE = "4ig_session";
const ADMIN_COOKIE = "4ig_admin";

function env() {
  return getCloudflareContext().env;
}

function authSecret(): string {
  const s = env().AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not configured");
  return s;
}

const cookieBase = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
};

// ---- Customer sessions ----
export type SessionUser = { id: string; name: string; email: string };

export async function createUserSession(user: SessionUser) {
  const token = await signJwt({ sub: user.id, name: user.name, email: user.email }, authSecret());
  const store = await cookies();
  store.set(USER_COOKIE, token, { ...cookieBase, maxAge: 60 * 60 * 24 * 7 });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(USER_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyJwt(token, authSecret());
  if (!payload?.sub) return null;
  return {
    id: String(payload.sub),
    name: String(payload.name ?? ""),
    email: String(payload.email ?? ""),
  };
}

export async function clearUserSession() {
  const store = await cookies();
  store.delete(USER_COOKIE);
}

// ---- Admin sessions (separate cookie, predefined credentials) ----
export async function createAdminSession() {
  const token = await signJwt({ role: "admin" }, authSecret(), 60 * 60 * 12);
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, { ...cookieBase, maxAge: 60 * 60 * 12 });
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const payload = await verifyJwt(token, authSecret());
  return payload?.role === "admin";
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

/** Throws a Response(401) if the caller is not an authenticated admin. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Response(JSON.stringify({ error: "Admin authentication required" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
}
