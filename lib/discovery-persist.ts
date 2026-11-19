import { createClient } from "./supabase/client";
import type { SpaceState } from "./space-state";

export async function persistDiscoveryProfile(state: SpaceState) {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return "Your session expired. Please sign in again.";

  const chosenWorld = state.chosen || state.visited || state.recommended;
  const basedIn = state.basedIn
    || [state.city, state.country].filter(Boolean).join(", ")
    || null;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      recommended_world_number: state.recommended || null,
      chosen_world_number: chosenWorld || null,
      discovery_completed_at: new Date().toISOString(),
      ...(state.dateOfBirth ? { date_of_birth: state.dateOfBirth } : {}),
      ...(basedIn ? { based_in: basedIn } : {}),
    })
    .eq("id", userData.user.id);

  return profileError ? "We could not save your discovery. Please try again." : null;
}
