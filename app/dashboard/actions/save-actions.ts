"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseBudget(value: string) {
  if (!value) {
    return 0;
  }

  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

export async function createCareerSave(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = formString(formData, "name");
  const club = formString(formData, "club");
  const managerName = formString(formData, "manager_name");
  const seasonLabel = formString(formData, "season_label");
  const visibility = formString(formData, "visibility") === "public" ? "public" : "private";

  if (!name || !club || !managerName || !seasonLabel) {
    redirect("/dashboard?error=missing-save-fields");
  }

  const { error } = await supabase.from("career_saves").insert({
    user_id: user.id,
    name,
    club,
    manager_name: managerName,
    season_label: seasonLabel,
    platform: "console",
    difficulty: formString(formData, "difficulty") || null,
    transfer_budget: parseBudget(formString(formData, "transfer_budget")),
    visibility,
  });

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateCareerSaveVisibility(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const saveId = formString(formData, "save_id");
  const visibility = formString(formData, "visibility") === "public" ? "public" : "private";

  if (!saveId) {
    redirect("/dashboard");
  }

  const { error } = await supabase
    .from("career_saves")
    .update({ visibility })
    .eq("id", saveId)
    .eq("user_id", user.id);

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
