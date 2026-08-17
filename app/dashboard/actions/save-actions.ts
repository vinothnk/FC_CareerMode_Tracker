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

function nullableUuid(value: string) {
  return value || null;
}

function parseOptionalNumber(value: string) {
  if (!value) {
    return null;
  }

  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function parseManualPlayers(formData: FormData) {
  return [0, 1, 2, 3, 4]
    .map((index) => {
      const displayName = formString(formData, `manual_players.${index}.display_name`);
      const primaryPosition = formString(formData, `manual_players.${index}.primary_position`);
      const overall = parseOptionalNumber(formString(formData, `manual_players.${index}.overall`));

      if (!displayName || !primaryPosition || !overall) {
        return null;
      }

      return {
        display_name: displayName,
        primary_position: primaryPosition.toUpperCase(),
        overall,
        potential: parseOptionalNumber(formString(formData, `manual_players.${index}.potential`)),
        age: parseOptionalNumber(formString(formData, `manual_players.${index}.age`)),
        value_amount: parseOptionalNumber(formString(formData, `manual_players.${index}.value_amount`)),
        wage_amount: parseOptionalNumber(formString(formData, `manual_players.${index}.wage_amount`)),
        squad_number: parseOptionalNumber(formString(formData, `manual_players.${index}.squad_number`)),
        notes: formString(formData, `manual_players.${index}.notes`) || null,
      };
    })
    .filter((player) => player !== null);
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
  const referenceClubId = nullableUuid(formString(formData, "reference_club_id"));

  if (!name || !managerName || !seasonLabel || (!club && !referenceClubId)) {
    redirect("/dashboard?error=missing-save-fields");
  }

  const { data, error } = await supabase.rpc("create_career_save_with_initial_data", {
    p_name: name,
    p_club_name: club,
    p_manager_name: managerName,
    p_season_label: seasonLabel,
    p_platform: "console",
    p_difficulty: formString(formData, "difficulty") || null,
    p_currency: formString(formData, "currency") || "USD",
    p_transfer_budget: parseBudget(formString(formData, "transfer_budget")),
    p_wage_budget: parseBudget(formString(formData, "wage_budget")),
    p_visibility: visibility,
    p_game_version_id: nullableUuid(formString(formData, "game_version_id")),
    p_reference_club_id: referenceClubId,
    p_house_rules: formString(formData, "house_rules"),
    p_board_expectations: {
      league_finish: formString(formData, "league_finish"),
      domestic_cup: formString(formData, "domestic_cup"),
      youth_development: formString(formData, "youth_development"),
    },
    p_import_reference_squad: referenceClubId ? formData.get("import_reference_squad") === "on" : false,
    p_manual_players: parseManualPlayers(formData),
  });

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  const saveId = data?.[0]?.save_id;

  revalidatePath("/dashboard");
  redirect(saveId ? `/dashboard/${saveId}` : "/dashboard");
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
