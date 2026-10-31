import type { Metadata } from "next";

import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const metadata: Metadata = {
  title: "Admin dashboard",
  description: "Program overview for the post-discharge cardiology program.",
};

export default function AdminDashboardPage() {
  return <AdminDashboard />;
}
