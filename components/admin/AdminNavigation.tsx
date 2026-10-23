"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/admin/overview", label: "Overview", enabled: true },
  { href: "/admin/stays", label: "Stays", enabled: true },
  { href: "/admin/activations", label: "Activations", enabled: true },
  { href: "/admin/orders", label: "Card orders", enabled: true },
  { href: "/admin/guests", label: "Guests", enabled: false },
  { href: "/admin/properties", label: "Properties", enabled: true },
  { href: "/admin/analytics", label: "Analytics", enabled: true },
  { href: "/admin/feedback", label: "Feedback", enabled: true },
  { href: "/admin/access", label: "Access", enabled: true, superAdminOnly: true },
];

export default function AdminNavigation({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="admin-navigation" aria-label="Administration">
      {navigation
        .filter((item) => !(item.superAdminOnly && !isSuperAdmin))
        .map((item) => item.enabled ? (
          <Link
            href={item.href}
            key={item.href}
            aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined}
          >
            {item.label}
          </Link>
        ) : (
          <span className="admin-nav-future" key={item.href}>{item.label}<small>Next phase</small></span>
        ))}
    </nav>
  );
}
