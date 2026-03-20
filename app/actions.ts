"use server";

import { revalidatePath } from "next/cache";

import { setPrimaryUser } from "@/lib/services/users";
import { syncUser } from "@/lib/services/sync-service";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function savePrimaryUserAction(formData: FormData) {
  const username = getString(formData, "username");

  if (!username) {
    throw new Error("Username is required.");
  }

  const user = await setPrimaryUser({ username });
  await syncUser(user.id);

  revalidatePath("/");
  revalidatePath("/problems");
  revalidatePath("/recommendations");
  revalidatePath("/settings");
}

export async function updateSettingsAction(formData: FormData) {
  const username = getString(formData, "username");
  const leetcodeSession = getString(formData, "leetcodeSession");
  const leetcodeCsrfToken = getString(formData, "leetcodeCsrfToken");

  if (!username) {
    throw new Error("Username is required.");
  }

  const user = await setPrimaryUser({
    username,
    leetcodeSession: leetcodeSession || null,
    leetcodeCsrfToken: leetcodeCsrfToken || null,
  });

  await syncUser(user.id);

  revalidatePath("/");
  revalidatePath("/problems");
  revalidatePath("/recommendations");
  revalidatePath("/settings");
}
