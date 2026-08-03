import { useMemo, useState } from "react";

import type { SupervisorStatDetailRow } from "@/services/mobileStats";
import type { StatDetailStatusFilter } from "@/types/stats";

export function useStatDetailFilters(rows: SupervisorStatDetailRow[]) {
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatDetailStatusFilter>("All");
  const [siteFilter, setSiteFilter] = useState("All");
  const [siteSearch, setSiteSearch] = useState("");

  const siteOptions = useMemo(
    () => ["All", ...Array.from(new Set(rows.map((row) => row.site))).filter(Boolean)],
    [rows],
  );

  const visibleSiteOptions = useMemo(() => {
    const query = siteSearch.trim().toLowerCase();
    if (!query) return siteOptions;
    return siteOptions.filter((site) => site.toLowerCase().includes(query));
  }, [siteOptions, siteSearch]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch =
        !query ||
        [row.title, row.reference, row.site, row.status, row.helper]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesStatus = statusFilter === "All" || row.status === statusFilter;
      const matchesSite = siteFilter === "All" || row.site === siteFilter;

      return matchesSearch && matchesStatus && matchesSite;
    });
  }, [rows, search, siteFilter, statusFilter]);

  const resetFilters = () => {
    setStatusFilter("All");
    setSiteFilter("All");
    setSiteSearch("");
    setFilterOpen(false);
  };

  return {
    search,
    setSearch,
    filterOpen,
    setFilterOpen,
    statusFilter,
    setStatusFilter,
    siteFilter,
    setSiteFilter,
    siteSearch,
    setSiteSearch,
    visibleSiteOptions,
    filteredRows,
    resetFilters,
  };
}
