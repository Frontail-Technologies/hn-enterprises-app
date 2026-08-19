import { useMemo, useState } from "react";

import type { SupervisorStatDetailRow } from "@/services/mobileStats";

// One search box covering every field the table itself shows (BP/TR,
// customer, address, site) - the separate status/site filter sheet this
// used to have wasn't worth its own UI for how rarely it narrowed anything
// search alone couldn't already find.
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
