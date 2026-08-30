const CUSTOMERS_LIST_PREFIX = ["customers", "list"] as const;
const CUSTOMERS_OPTIONS_PREFIX = ["customers", "options"] as const;

type ExpenseKeyParams = {
  search?: string;
  category?: string;
  from?: string;
  to?: string;
  columnFilters?: Record<string, string[] | undefined>;
  totalsOnly?: boolean;
};

export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  stats: {
    all: ["stats"] as const,
    summary: ["stats", "summary"] as const,
    details: (type: string) => ["stats", "details", type] as const,
    detailsInfinite: (type: string) =>
      ["stats", "details", type, "infinite"] as const,
  },
  customers: {
    all: ["customers"] as const,
    allLists: CUSTOMERS_LIST_PREFIX,
    allOptions: CUSTOMERS_OPTIONS_PREFIX,
    list: (search?: string) =>
      [...CUSTOMERS_LIST_PREFIX, search ?? ""] as const,
    infiniteList: (search?: string) =>
      [...CUSTOMERS_LIST_PREFIX, search ?? "", "infinite"] as const,
    options: (search?: string) =>
      [...CUSTOMERS_OPTIONS_PREFIX, search ?? ""] as const,
    detail: (id?: string) => ["customers", "detail", id ?? ""] as const,
    notes: (id?: string) => ["customers", "notes", id ?? ""] as const,
  },
  activity: {
    all: ["activity"] as const,
    recent: (params: {
      supervisorId?: string;
      limit?: number;
      extraIds?: string[];
    }) => ["activity", "recent", params] as const,
  },
  notifications: {
    all: ["notifications"] as const,
  },
  projects: {
    all: ["projects"] as const,
    sites: (projectId: string) => ["projects", "sites", projectId] as const,
    allSites: ["projects", "sites", "all"] as const,
  },
  planning: {
    all: ["planning"] as const,
    sitePlans: (params: {
      projectId?: string;
      siteId?: string;
      supervisorId?: string;
      customerId?: string;
      date?: string;
    }) => ["planning", "site-plans", params] as const,
    dprRecords: (params: {
      projectId?: string;
      siteId?: string;
      supervisorId?: string;
      customerId?: string;
      date?: string;
    }) => ["planning", "dpr-records", params] as const,
    workOverview: (date: string) =>
      ["planning", "work-overview", date] as const,
    dprOverview: (date: string) => ["planning", "dpr-overview", date] as const,
    siteCustomers: (siteId: string) =>
      ["planning", "site-customers", siteId] as const,
  },
  work: {
    all: ["work"] as const,
    queue: (params?: {
      search?: string;
      status?: string;
      projectId?: string;
      siteId?: string;
      stage?: string;
    }) => ["work", "queue", params ?? {}] as const,
    queueSummary: (params?: {
      search?: string;
      status?: string;
      projectId?: string;
      siteId?: string;
      stage?: string;
    }) => ["work", "queue", "summary", params ?? {}] as const,
    history: (customerId?: string) =>
      ["work", "history", customerId ?? ""] as const,
  },
  attendance: {
    all: ["attendance"] as const,
    allMonths: ["attendance", "month"] as const,
    month: (month: string) => ["attendance", "month", month] as const,
    day: (date: string) => ["attendance", "day", date] as const,
  },
  expenses: {
    all: ["expenses"] as const,
    detail: (id?: string) => ["expenses", "detail", id ?? ""] as const,
    infiniteList: (params: ExpenseKeyParams) =>
      ["expenses", "list", "infinite", params] as const,
    summary: (params: ExpenseKeyParams) =>
      ["expenses", "summary", params] as const,
    filterValues: (column: string) =>
      ["expenses", "filter-values", column] as const,
  },
  plumbers: {
    all: ["plumbers"] as const,
    options: ["plumbers", "options"] as const,
  },
  complaints: {
    all: ["complaints"] as const,
    list: (params: { supervisorId?: string; status?: string }) =>
      ["complaints", "list", params] as const,
    infiniteList: (params: {
      supervisorId?: string;
      status?: string;
      search?: string;
    }) => ["complaints", "list", "infinite", params] as const,
    statusCounts: (params: { supervisorId?: string }) =>
      ["complaints", "status-counts", params] as const,
  },
  masters: {
    all: ["masters"] as const,
    values: (category: string) => ["masters", "values", category] as const,
    customFields: ["masters", "custom-fields", "active"] as const,
  },
};
