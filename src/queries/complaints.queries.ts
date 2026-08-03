import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { complaintsApi } from "@/services/complaints.service";
import type { ComplaintStatus } from "@/services/complaints.service";
import { queryKeys } from "./keys";

export function useComplaintsQuery(params: { supervisorId?: string; status?: ComplaintStatus } = {}) {
  return useQuery({
    queryKey: queryKeys.complaints.list(params),
    queryFn: () => complaintsApi.list(params),
    enabled: Boolean(params.supervisorId),
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
