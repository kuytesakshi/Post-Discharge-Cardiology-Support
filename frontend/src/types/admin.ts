export type MetricTrend = "up" | "down" | "flat";
export type MetricTone = "teal" | "emerald" | "coral" | "amber";

export interface AdminMetric {
  label: string;
  value: string;
  helper: string;
  trend: MetricTrend;
  trendLabel: string;
  tone: MetricTone;
  sparkline: number[];
}

export type RiskLevel = "low" | "moderate" | "high";
export type PatientStatus = "on_track" | "needs_attention" | "overdue";

export interface AdminPatient {
  id: string;
  name: string;
  age: number | null;
  condition: string;
  risk: RiskLevel;
  doctor: string;
  nextFollowUp: string;
  status: PatientStatus;
}

export type DoctorAvailability = "available" | "in_consult" | "off_duty";

export interface AdminDoctor {
  id: string;
  name: string;
  initials: string;
  specialty: string;
  patients: number;
  availability: DoctorAvailability;
}

export interface AdminAppointment {
  id: string;
  time: string;
  patient: string;
  doctor: string;
  type: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
}

export type AlertSeverity = "high" | "medium" | "low";

export interface AdminAlert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  href: string;
  actionLabel: string;
}

export interface AdminActivity {
  id: string;
  title: string;
  description: string;
  time: string;
  tone: "emerald" | "teal" | "coral" | "amber";
}

export interface FollowUpPoint {
  label: string;
  completed: number;
  scheduled: number;
}

export interface RiskSlice {
  label: string;
  value: number;
  color: string;
}

export interface AdminDashboardData {
  adminName: string;
  displayDate: string;
  lastUpdated: string;
  generatedAt?: string;
  metrics: AdminMetric[];
  followUpSeries: FollowUpPoint[];
  riskMix: RiskSlice[];
  recentPatients: AdminPatient[];
  careTeam: AdminDoctor[];
  appointments: AdminAppointment[];
  alerts: AdminAlert[];
  activity: AdminActivity[];
}
