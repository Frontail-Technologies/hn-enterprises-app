import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { complaintsApi } from "@/services/complaints.service";
import type { ComplaintPriority, ComplaintStatus } from "@/services/complaints.service";
import { queryKeys } from "./keys";
import { nextPageParam } from "./pagination";

export function useComplaintsQuery(params: { supervisorId?: string; status?: ComplaintStatus } = {}) {
  return useQuery({
    queryKey: queryKeys.complaints.list(params),
    queryFn: () => complaintsApi.list(params),
  });
}

export function useComplaintStatusCountsQuery(params: { supervisorId?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.complaints.statusCounts(params),
    queryFn: () => complaintsApi.statusCounts(params),
    staleTime: 60_000,
  });
}

const COMPLAINTS_PAGE_SIZE = 100;

export function useComplaintsInfiniteQuery(
  params: { search?: string; status?: ComplaintStatus; supervisorId?: string } = {},
) {
  return useInfiniteQuery({
    queryKey: queryKeys.complaints.infiniteList(params),
    queryFn: ({ pageParam }) => complaintsApi.listPage({ page: pageParam, limit: COMPLAINTS_PAGE_SIZE, ...params }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => nextPageParam(lastPage.pagination),
    // Keep previously loaded pages visible while a changed search/status
    // refetches, so the list doesn't flash its skeleton on every keystroke.
    placeholderData: keepPreviousData,
  });
}

export function useCreateComplaintMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { customerId: string; title: string; description: string; priority: ComplaintPriority }) =>
      complaintsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.complaints.all });
    },
  });
}

export function useUpdateComplaintMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, supervisorRemark }: { id: string; status: ComplaintStatus; supervisorRemark?: string }) =>
      complaintsApi.updateStatus(id, { status, supervisorRemark }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.complaints.all });
    },
  });
}
