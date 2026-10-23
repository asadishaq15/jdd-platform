"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AdminProperty } from "../../lib/admin-auth";

export default function AdminPropertySelector({
  properties,
  allowAll,
}: {
  properties: AdminProperty[];
  allowAll: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = searchParams.get("property") || (allowAll ? "all" : properties[0]?.id || "");

  function selectProperty(value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value === "all") next.delete("property");
    else next.set("property", value);
    router.push(`${pathname}${next.size ? `?${next.toString()}` : ""}`);
  }

  return (
    <label className="admin-property-picker">
      <span>Property</span>
      <select value={selected} onChange={(event) => selectProperty(event.target.value)}>
        {allowAll && <option value="all">All properties</option>}
        {properties.map((property) => (
          <option value={property.id} key={property.id}>
            {property.name}{property.isActive ? "" : " (inactive)"}
          </option>
        ))}
      </select>
    </label>
  );
}
