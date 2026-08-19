import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  workProgressApi,
  type WorkProgressEvidenceFile,
  type WorkQueueFilterParams,
} from "@/services/workProgress.service";
import type { WorkProgressStatus, WorkStage } from "@/types/workProgress";
import { queryKeys } from "./keys";
import { nextPageParam } from "./pagination";

const WORK_QUEUE_PAGE_SIZE = 100;

export function useWorkQueueInfiniteQuery(params: WorkQueueFilterParams = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.work.queue(params),
    queryFn: ({ pageParam }) =>
      workProgressApi.listQueuePage({
        page: pageParam,
        limit: WORK_QUEUE_PAGE_SIZE,
        ...params,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => nextPageParam(lastPage.pagination),
    placeholderData: keepPreviousData,
  });
}

export function useWorkQueueSummaryQuery(params: WorkQueueFilterParams = {}) {
  return useQuery({
    queryKey: queryKeys.work.queueSummary(params),
    queryFn: () => workProgressApi.queueSummary(params),
    placeholderData: keepPreviousData,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.work.all });
    },
  });
}
