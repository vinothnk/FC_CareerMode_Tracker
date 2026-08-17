"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  authenticateUser,
  createSession,
  createUser,
  deleteSession,
  sessionCookieName,
} from "@/lib/sqlite/db";
import { sessionCookieOptions } from "@/lib/sqlite/auth";

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function authErrorUrl(message: string) {
  const params = new URLSearchParams({ message });
  return `/auth/error?${params.toString()}`;
}

export async function login(formData: FormData) {
  const email = formString(formData, "email");
  const password = formString(formData, "password");
  const next = formString(formData, "next") || "/dashboard";

  if (!email || !password) {
    redirect(authErrorUrl("Email and password are required."));
  }

  const user = authenticateUser(email, password);

  if (!user) {
    redirect(authErrorUrl("Invalid email or password."));
  }

  const { token, expiresAt } = createSession(user.id);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, sessionCookieOptions(expiresAt));

  revalidatePath("/", "layout");
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function register(formData: FormData) {
  const email = formString(formData, "email");
  const password = formString(formData, "password");

  if (!email || password.length < 8) {
    redirect(authErrorUrl("Use an email and a password with at least 8 characters."));
  }

  let user;

  try {
    user = createUser(email, password);
  } catch {
    redirect(authErrorUrl("An account with that email already exists."));
  }

  const { token, expiresAt } = createSession(user.id);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, sessionCookieOptions(expiresAt));

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (token) {
    deleteSession(token);
  }

  cookieStore.delete(sessionCookieName);
  revalidatePath("/", "layout");
  redirect("/");
}
