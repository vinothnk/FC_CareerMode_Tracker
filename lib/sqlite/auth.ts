import { cookies } from "next/headers";
import { getUserBySessionToken, type LocalUser } from "@/lib/sqlite/db";
import { sessionCookieName } from "@/lib/sqlite/constants";

export async function getCurrentUser(): Promise<LocalUser | null> {
  const cookieStore = await cookies();
  return getUserBySessionToken(cookieStore.get(sessionCookieName)?.value);
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return user;
}

export function sessionCookieOptions(expires: Date) {
  return {
    expires,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}
