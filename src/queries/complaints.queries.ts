import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { complaintsApi } from "@/services/complaints.service";
import type { ComplaintStatus } from "@/services/complaints.service";
import { queryKeys } from "./keys";

export function useComplaintsQuery(params: { supervisorId?: string; status?: ComplaintStatus } = {}) {
  return useQuery({
    queryKey: queryKeys.complaints.list(params),
    queryFn: () => complaintsApi.list(params),
  });
}

export function useCreateComplaintMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { customerId: string; title: string; description: string; priority: any }) =>
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
