import type { ReactNode } from "react";

import {
  DashboardShell,
  type NavItem,
} from "@/components/layout/dashboard-shell";

const navItems: NavItem[] = [
  { href: "/patient/dashboard", label: "Dashboard" },
  { href: "/patient/appointments", label: "Appointments" },
  { href: "/patient/queries", label: "My queries" },
];

export default function PatientLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell role="patient" navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
