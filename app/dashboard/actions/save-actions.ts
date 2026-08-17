"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/sqlite/auth";
import {
  createCareerSaveWithInitialData,
  updateCareerSaveVisibilityForUser,
} from "@/lib/sqlite/db";

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
        role: null,
        status: "first_team" as const,
        notes: formString(formData, `manual_players.${index}.notes`) || null,
      };
    })
    .filter((player) => player !== null);
}

export async function createCareerSave(formData: FormData) {
  const user = await getCurrentUser();

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

  let saveId: string;

  try {
    saveId = createCareerSaveWithInitialData({
      userId: user.id,
      name,
      club,
      managerName,
      seasonLabel,
      platform: "console",
      difficulty: formString(formData, "difficulty") || null,
      currency: formString(formData, "currency") || "USD",
      transferBudget: parseBudget(formString(formData, "transfer_budget")),
      wageBudget: parseBudget(formString(formData, "wage_budget")),
      visibility,
      gameVersionId: nullableUuid(formString(formData, "game_version_id")),
      referenceClubId,
      houseRules: formString(formData, "house_rules"),
      boardExpectations: {
      league_finish: formString(formData, "league_finish"),
      domestic_cup: formString(formData, "domestic_cup"),
      youth_development: formString(formData, "youth_development"),
      },
      importReferenceSquad: referenceClubId ? formData.get("import_reference_squad") === "on" : false,
      manualPlayers: parseManualPlayers(formData),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create save.";
    redirect(`/dashboard?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard/${saveId}`);
}

export async function updateCareerSaveVisibility(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const saveId = formString(formData, "save_id");
  const visibility = formString(formData, "visibility") === "public" ? "public" : "private";

  if (!saveId) {
    redirect("/dashboard");
  }

  updateCareerSaveVisibilityForUser(user.id, saveId, visibility);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
