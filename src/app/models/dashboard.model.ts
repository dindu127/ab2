// src/app/models/dashboard.model.ts
export interface Kpi {
  title: string;
  value: string | number;
  sub?: string;
}

export interface DashboardSummary {
  totalProperties: number;
  pendingApprovals: number;
  premiumUsers: number;

  // accept either name — make both optional so different callers won't break
  totalRevenue?: number;
  revenue?: number;
}
