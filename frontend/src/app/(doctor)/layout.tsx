import type { ReactNode } from "react";

import {
  DashboardShell,
  type NavItem,
} from "@/components/layout/dashboard-shell";

const navItems: NavItem[] = [
  { href: "/doctor/dashboard", label: "Dashboard" },
  { href: "/doctor/appointments", label: "Appointments" },
  { href: "/doctor/queries", label: "Patient queries" },
];

export default function DoctorLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell role="doctor" navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
