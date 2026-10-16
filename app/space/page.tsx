import { redirect } from "next/navigation";
import SpaceEntry from "../../components/space/SpaceEntry";
import type { ConnectedStay } from "../../lib/space-data";
import { createClient } from "../../lib/supabase/server";
import "../../components/discovery/discovery.css";
import "../../components/space/space-entry.css";

type SpacePageProps = {
  searchParams: Promise<{ stay?: string }>;
};

type RawStay = {
  id: string;
  guest_name: string | null;
  check_in: string | null;
  check_out: string | null;
  activated_at: string | null;
  property: {
    name: string;
    country: string | null;
    world_number: number;
  } | null;
};

export default async function SpacePage({ searchParams }: SpacePageProps) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) redirect("/sign-in?next=/space");

  const [{ data: profile }, { data: stayRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url, recommended_world_number, chosen_world_number")
      .eq("id", userData.user.id)
      .maybeSingle(),
    supabase
      .from("stays")
      .select("id, guest_name, check_in, check_out, activated_at, property:properties(name, country, world_number)")
      .order("activated_at", { ascending: false }),
  ]);

  const stays: ConnectedStay[] = ((stayRows || []) as unknown as RawStay[])
    .filter((stay) => stay.property)
    .map((stay) => ({
      id: stay.id,
      guestName: stay.guest_name,
      checkIn: stay.check_in,
      checkOut: stay.check_out,
      activatedAt: stay.activated_at,
      property: {
        name: stay.property!.name,
        country: stay.property!.country,
        worldNumber: stay.property!.world_number,
      },
    }));

  const requestedStay = (await searchParams).stay;
  const activeStayId = stays.some((stay) => stay.id === requestedStay)
    ? requestedStay
    : stays[0]?.id;

  return (
    <SpaceEntry
      account={{
        id: userData.user.id,
        fullName: profile?.full_name
          || userData.user.user_metadata.full_name
          || userData.user.user_metadata.name
          || "Guest",
        email: userData.user.email || "",
        avatarUrl: profile?.avatar_url || userData.user.user_metadata.avatar_url || null,
      }}
      stays={stays}
      activeStayId={activeStayId}
      initialState={{
        recommended: profile?.recommended_world_number || undefined,
        chosen: profile?.chosen_world_number || undefined,
      }}
    />
  );
}
