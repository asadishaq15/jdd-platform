"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GradientDefs from "../../../components/layout/GradientDefs";
import { persistDiscoveryProfile } from "../../../lib/discovery-persist";
import { loadSpaceState } from "../../../lib/space-state";
import { hydrateLocalSpaceFromServer } from "../../../lib/space-state-sync";
import { createClient } from "../../../lib/supabase/client";
import "../../../components/onboarding/visitor-onboarding.css";

export default function AuthCompletePage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function hydrateSpaceProgress(userId: string) {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("recommended_world_number, chosen_world_number")
        .eq("id", userId)
        .maybeSingle();
      await hydrateLocalSpaceFromServer({
        recommended: profile?.recommended_world_number ?? null,
        chosen: profile?.chosen_world_number ?? null,
      });
    }

    async function run() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.replace("/sign-in");
        return;
      }

      const draft = loadSpaceState();
      if (draft.recommended) {
        if (!draft.chosen) {
          draft.chosen = draft.recommended;
          draft.entryMode = draft.entryMode || "recommended";
        }
        const message = await persistDiscoveryProfile(draft);
        if (cancelled) return;
        if (message) {
          setError(message);
          window.setTimeout(() => router.replace("/discover"), 1600);
          return;
        }
        await hydrateSpaceProgress(userData.user.id);
        if (cancelled) return;
        router.replace("/space");
        return;
      }

      const [{ data: profile }, { data: stays }, { data: adminMemberships }] = await Promise.all([
        supabase
          .from("profiles")
          .select("discovery_completed_at, recommended_world_number, chosen_world_number")
          .eq("id", userData.user.id)
          .maybeSingle(),
        supabase.from("stays").select("id").eq("guest_id", userData.user.id).limit(1),
        supabase.from("admin_memberships").select("id").eq("user_id", userData.user.id).eq("is_active", true).limit(1),
      ]);

      if (cancelled) return;
      if (adminMemberships?.length) {
        router.replace("/admin");
        return;
      }
      if (profile?.discovery_completed_at || stays?.length) {
        await hydrateSpaceProgress(userData.user.id);
        if (cancelled) return;
        router.replace("/space");
        return;
      }
      router.replace("/discover");
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="visitor-app">
      <GradientDefs />
      <div className="screens">
        <section className="scr on" data-name="load" aria-label="Loading" aria-live="polite">
          <div className="col auth-loading">
            <div className="stage">
              <div className="loader" aria-hidden="true">
                <svg viewBox="0 0 120 120">
                  <circle className="ring" cx="60" cy="60" r="46" />
                  <circle className="arc" cx="60" cy="60" r="46" pathLength="1" />
                </svg>
              </div>
              <p className="load-title">
                <span className="l1">One moment.</span>
                <span className="l2">{error || "Preparing your private space."}</span>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
