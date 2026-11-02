"use server";

import { db } from "@/lib/db";
import type { SrsMethod } from "@/lib/srs";

export type SettingsResult = { success: true } | { success: false; error: string };

export async function saveSettings(
  _prev: SettingsResult | null,
  formData: FormData,
): Promise<SettingsResult> {
  const srsMethod = formData.get("srs_method") as SrsMethod;
  const rawIntervals = (formData.get("srs_intervals") as string | null) ?? "";

  const intervals = rawIntervals
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);

  if (!["sm2", "leitner", "2357", "custom"].includes(srsMethod)) {
    return { success: false, error: "Invalid SRS method." };
  }
  if (srsMethod === "custom" && intervals.length === 0) {
    return { success: false, error: "Custom mode needs at least one interval." };
  }

  db().prepare("update settings set srs_method = ?, srs_intervals = ? where id = 1")
    .run(srsMethod, JSON.stringify(intervals));
  return { success: true };
}

export async function updateDailyTarget(
  _prev: SettingsResult | null,
  formData: FormData,
): Promise<SettingsResult> {
  const target = Number(formData.get("daily_target"));
  if (!Number.isInteger(target) || target < 1 || target > 100) {
    return { success: false, error: "Goal must be between 1 and 100." };
  }
  db().prepare("update settings set daily_target = ? where id = 1").run(target);
  return { success: true };
}
