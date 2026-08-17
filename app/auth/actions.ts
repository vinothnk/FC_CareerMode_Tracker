"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(authErrorUrl(error.message));
  }

  revalidatePath("/", "layout");
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function register(formData: FormData) {
  const email = formString(formData, "email");
  const password = formString(formData, "password");

  if (!email || password.length < 8) {
    redirect(authErrorUrl("Use an email and a password with at least 8 characters."));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(authErrorUrl(error.message));
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
