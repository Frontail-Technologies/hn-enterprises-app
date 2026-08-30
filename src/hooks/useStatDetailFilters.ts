import { useMemo, useState } from "react";

import type { SupervisorStatDetailRow } from "@/services/mobileStats";

export function useStatDetailFilters(rows: SupervisorStatDetailRow[]) {
  const [search, setSearch] = useState("");

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((row) =>
      [row.reference, row.title, row.address, row.site, row.status, row.helper]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [rows, search]);

  return {
    search,
    setSearch,
    filteredRows,
  };
}
