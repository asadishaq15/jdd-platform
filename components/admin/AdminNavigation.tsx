"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/admin/overview", label: "Overview" },
  { href: "/admin/stays", label: "Stays" },
  { href: "/admin/activations", label: "Activations" },
  { href: "/admin/properties", label: "Properties" },
  { href: "/admin/community", label: "Community" },
  { href: "/admin/integrations", label: "Integrations" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/invite", label: "Invite", superAdminOnly: true },
];

export default function AdminNavigation({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="admin-navigation" aria-label="Administration">
      {navigation
        .filter((item) => !(item.superAdminOnly && !isSuperAdmin))
        .map((item) => (
          <Link
            href={item.href}
            key={item.href}
            aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
    </nav>
  );
}
