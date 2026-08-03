import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  workProgressApi,
  type BackendWorkProgressUpdate,
  type WorkProgressEvidenceFile,
} from "@/services/workProgress.service";
import type { WorkProgressStatus, WorkStage } from "@/services/mockData";
import { queryKeys } from "./keys";

export function useWorkQueueQuery(params: { projectId?: string; siteId?: string; search?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.work.queue(params),
    queryFn: () => workProgressApi.listQueue(params),
  });
}

export function useWorkProgressHistoryQuery(customerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.work.history(customerId),
    queryFn: () => workProgressApi.list({ customerId }),
    enabled: Boolean(customerId),
  });
}

export function useCreateWorkProgressMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: {
      customerId: string;
      stage: WorkStage;
      status: WorkProgressStatus;
      nextRequiredAction?: string;
      remarks?: string;
      evidence?: WorkProgressEvidenceFile[];
    }) => workProgressApi.createUpdate(body),
    onSuccess: (record: BackendWorkProgressUpdate) => {
      queryClient.invalidateQueries({ queryKey: ["work"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.work.history(record.customerId) });
    },
  });
}
