"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/sqlite/auth";
import {
  bulkUpsertSavePlayersForUser,
  createSavePlayerForUser,
  normalizeSquadStatus,
  updateSavePlayerForUser,
  type PlayerFormInput,
} from "@/lib/sqlite/db";

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseOptionalNumber(value: string) {
  if (!value) {
    return null;
  }

  const amount = Number(value.replaceAll(",", ""));
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function parseRequiredRating(value: string) {
  const amount = parseOptionalNumber(value);
  return amount && amount >= 1 && amount <= 99 ? amount : -1;
}

function playerInputFromForm(formData: FormData): PlayerFormInput {
  return {
    displayName: formString(formData, "display_name"),
    primaryPosition: formString(formData, "primary_position").toUpperCase() || "UNK",
    role: formString(formData, "role") || null,
    status: normalizeSquadStatus(formString(formData, "status")),
    overall: parseRequiredRating(formString(formData, "overall")),
    potential: parseOptionalNumber(formString(formData, "potential")),
    age: parseOptionalNumber(formString(formData, "age")),
    valueAmount: parseOptionalNumber(formString(formData, "value_amount")),
    wageAmount: parseOptionalNumber(formString(formData, "wage_amount")),
    squadNumber: parseOptionalNumber(formString(formData, "squad_number")),
    notes: formString(formData, "notes") || null,
  };
}

function assertPlayerInput(input: PlayerFormInput) {
  if (!input.displayName) {
    throw new Error("Player name is required.");
  }

  if (input.overall < 1 || input.overall > 99) {
    throw new Error("OVR must be between 1 and 99.");
  }

  if (input.potential !== null && (input.potential < 1 || input.potential > 99)) {
    throw new Error("Potential must be between 1 and 99.");
  }

  if (input.age !== null && (input.age < 15 || input.age > 60)) {
    throw new Error("Age must be between 15 and 60.");
  }
}

export async function createPlayerAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const saveId = formString(formData, "save_id");
  const input = playerInputFromForm(formData);

  try {
    assertPlayerInput(input);
    createSavePlayerForUser(user.id, saveId, input);
  } catch (error) {
    redirect(`/dashboard/${saveId}/squad?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to add player.")}`);
  }

  revalidatePath(`/dashboard/${saveId}`);
  revalidatePath(`/dashboard/${saveId}/squad`);
  redirect(`/dashboard/${saveId}/squad`);
}

export async function updatePlayerAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const saveId = formString(formData, "save_id");
  const playerId = formString(formData, "player_id");
  const input = playerInputFromForm(formData);

  try {
    assertPlayerInput(input);
    updateSavePlayerForUser(user.id, saveId, playerId, input);
  } catch (error) {
    redirect(`/dashboard/${saveId}/squad/${playerId}?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to update player.")}`);
  }

  revalidatePath(`/dashboard/${saveId}`);
  revalidatePath(`/dashboard/${saveId}/squad`);
  revalidatePath(`/dashboard/${saveId}/squad/${playerId}`);
  redirect(`/dashboard/${saveId}/squad/${playerId}`);
}

export async function bulkImportPlayersAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const saveId = formString(formData, "save_id");
  const rows = formString(formData, "bulk_players")
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean);

  const players = rows.map((row) => {
    const [
      displayName,
      primaryPosition,
      overall,
      potential,
      age,
      valueAmount,
      wageAmount,
      role,
      status,
      squadNumber,
    ] = row.split(",").map((cell) => cell.trim());

    return {
      displayName,
      primaryPosition: (primaryPosition || "UNK").toUpperCase(),
      overall: parseRequiredRating(overall ?? ""),
      potential: parseOptionalNumber(potential ?? ""),
      age: parseOptionalNumber(age ?? ""),
      valueAmount: parseOptionalNumber(valueAmount ?? ""),
      wageAmount: parseOptionalNumber(wageAmount ?? ""),
      role: role || null,
      status: normalizeSquadStatus(status),
      squadNumber: parseOptionalNumber(squadNumber ?? ""),
      notes: null,
    } satisfies PlayerFormInput;
  });

  try {
    for (const player of players) {
      assertPlayerInput(player);
    }

    bulkUpsertSavePlayersForUser(user.id, saveId, players);
  } catch (error) {
    redirect(`/dashboard/${saveId}/squad?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to import players.")}`);
  }

  revalidatePath(`/dashboard/${saveId}`);
  revalidatePath(`/dashboard/${saveId}/squad`);
  redirect(`/dashboard/${saveId}/squad`);
}
