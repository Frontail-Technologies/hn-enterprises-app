export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  stats: {
    summary: ["stats", "summary"] as const,
    details: (type: string) => ["stats", "details", type] as const,
  },
  customers: {
    list: (search?: string) => ["customers", "list", search ?? ""] as const,
    detail: (id?: string) => ["customers", "detail", id ?? ""] as const,
    notes: (id?: string) => ["customers", "notes", id ?? ""] as const,
  },
  activity: {
    recent: (params: { supervisorId?: string; limit?: number; extraIds?: string[] }) =>
      ["activity", "recent", params] as const,
  },
  notifications: {
    all: ["notifications"] as const,
  },
  projects: {
    all: ["projects"] as const,
    sites: (projectId: string) => ["projects", projectId, "sites"] as const,
  },
  planning: {
    sitePlans: (params: { projectId?: string; siteId?: string; supervisorId?: string; date?: string }) =>
      ["planning", "site-plans", params] as const,
    dprRecords: (params: { projectId?: string; siteId?: string; supervisorId?: string; date?: string }) =>
      ["planning", "dpr-records", params] as const,
  },
  work: {
    queue: (params?: { projectId?: string; siteId?: string; search?: string }) => ["work", "queue", params ?? {}] as const,
    history: (customerId?: string) => ["work", "history", customerId ?? ""] as const,
  },
  attendance: {
    month: (month: string) => ["attendance", "month", month] as const,
    day: (date: string) => ["attendance", "day", date] as const,
  },
  expenses: {
    all: ["expenses"] as const,
  },
  plumbers: {
    all: ["plumbers"] as const,
  },
  complaints: {
    all: ["complaints"] as const,
    list: (params: { supervisorId?: string; status?: string }) => ["complaints", "list", params] as const,
  },
};
