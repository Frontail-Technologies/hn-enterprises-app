import { useMemo, useState } from 'react';

import { useComplaintsQuery } from '@/queries';
import type { ComplaintRecord } from '@/services/complaints.service';
import type { ComplaintStatusFilter } from '@/types/complaints';

export function useComplaintsScreen() {
  const { data: complaints = [], isLoading, refetch } = useComplaintsQuery();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ComplaintStatusFilter>('All');
  const [activeComplaint, setActiveComplaint] = useState<ComplaintRecord | null>(null);

  const filteredComplaints = useMemo(() => {
    const query = search.trim().toLowerCase();

    return complaints.filter((complaint) => {
      const matchesSearch = query
        ? [complaint.title, complaint.customerName, complaint.description]
            .join(' ')
            .toLowerCase()
            .includes(query)
        : true;
      const matchesStatus = statusFilter === 'All' ? true : complaint.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [complaints, search, statusFilter]);

  return {
    isLoading,
    complaints,
    filteredComplaints,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    activeComplaint,
    setActiveComplaint,
    refetch,
  };
}
