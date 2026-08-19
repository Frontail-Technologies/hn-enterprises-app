import { sitePlanInvalidationKeys } from "./planning.queries";
import { queryKeys } from "./keys";
import type { BackendSitePlan } from "@/services/planning.service";

function makeRecord(overrides: Partial<BackendSitePlan> = {}): BackendSitePlan {
  return {
    id: "plan-1",
    customerId: "cust-1",
    projectId: "proj-1",
    siteId: "site-1",
    date: "2026-01-01",
    supervisorId: "sup-1",
    tasks: [],
    ...overrides,
  } as BackendSitePlan;
}

describe("sitePlanInvalidationKeys", () => {
  it("invalidates the canonical stats prefix alongside planning/activity/project-sites", () => {
    const keys = sitePlanInvalidationKeys(makeRecord());

    expect(keys).toContainEqual(queryKeys.stats.all);
    expect(keys).toContainEqual(queryKeys.planning.all);
    expect(keys).toContainEqual(queryKeys.activity.all);
    expect(keys).toContainEqual(queryKeys.projects.sites("proj-1"));
  });

  it("scopes the project-sites invalidation to the saved record's own project", () => {
    const keys = sitePlanInvalidationKeys(makeRecord({ projectId: "proj-2" }));
    expect(keys).toContainEqual(queryKeys.projects.sites("proj-2"));
    expect(keys).not.toContainEqual(queryKeys.projects.sites("proj-1"));
  });
});
