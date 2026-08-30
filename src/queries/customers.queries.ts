import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { addActionBreadcrumb } from "@/lib/sentry";
import { customersService } from "@/services/customers.service";
import { nextPageParam } from "./pagination";
import type {
  BillingCompletion,
  CommissioningConversion,
  CompletionSectionKey,
  CustomerRecord,
  FittingsAccessories,
  GiMeasurements,
  IsolationFittings,
  LmcPipeRecord,
  LmcPipelineWork,
  MdpeFittings,
} from "@/types/customers";
import { queryKeys } from "./keys";

export function useCustomerListQuery(search?: string) {
  return useQuery({
    queryKey: queryKeys.customers.list(search),
    queryFn: () => customersService.list(search),
    placeholderData: keepPreviousData,
  });
}

export function useCustomerOptionsQuery(search?: string) {
  return useQuery({
    queryKey: queryKeys.customers.options(search),
    queryFn: () => customersService.listOptions(search),
    placeholderData: keepPreviousData,
  });
}

const CUSTOMER_PAGE_SIZE = 100;

export function useCustomerInfiniteListQuery(search?: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.customers.infiniteList(search),
    queryFn: ({ pageParam }) => customersService.listPage({ page: pageParam, limit: CUSTOMER_PAGE_SIZE, search }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => nextPageParam(lastPage.pagination),
    placeholderData: keepPreviousData,
  });
}

export function useCustomerQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => customersService.get(id as string),
    enabled: Boolean(id),
  });
}

export function invalidateCustomerDependents(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.customers.allLists });
  queryClient.invalidateQueries({ queryKey: queryKeys.customers.allOptions });
  queryClient.invalidateQueries({ queryKey: queryKeys.work.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
}

function useCustomerMutation<TBody>(mutationFn: (body: TBody) => Promise<CustomerRecord>, label: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: TBody) => {
      addActionBreadcrumb("form", "submit_started", { form: label });
      return mutationFn(body);
    },
    onSuccess: (customer) => {
      addActionBreadcrumb("form", "submit_succeeded", { form: label });
      queryClient.setQueryData(queryKeys.customers.detail(customer.id), customer);
      invalidateCustomerDependents(queryClient);
    },
    onError: () => {
      addActionBreadcrumb("form", "submit_failed", { form: label });
    },
  });
}

export function useSetSectionCompletionMutation(customerId: string) {
  return useCustomerMutation<{ sectionKey: CompletionSectionKey; completed: boolean }>(
    ({ sectionKey, completed }) => customersService.setSectionCompletion(customerId, sectionKey, completed),
    "section-completion",
  );
}

export function useUpdateSurveyMutation(customerId: string) {
  return useCustomerMutation<CustomerRecord["survey"]>(
    (survey) => customersService.updateSurvey(customerId, survey),
    "survey",
  );
}

export function useUpdateGiMeasurementsMutation(customerId: string) {
  return useCustomerMutation<GiMeasurements>(
    (values) => customersService.updateGiMeasurements(customerId, values),
    "gi-measurements",
  );
}

export function useUpdateIsolationRegulatorsMutation(customerId: string) {
  return useCustomerMutation<IsolationFittings>(
    (values) => customersService.updateIsolationRegulators(customerId, values),
    "isolation-regulators",
  );
}

export function useUpdateFittingsAccessoriesMutation(customerId: string) {
  return useCustomerMutation<FittingsAccessories>(
    (values) => customersService.updateFittingsAccessories(customerId, values),
    "fittings-accessories",
  );
}

export function useUpdateCivilWorkMutation(customerId: string) {
  return useCustomerMutation<Omit<LmcPipelineWork, "pipeRecords">>(
    (values) => customersService.updateCivilWork(customerId, values),
    "lmc-civil-work",
  );
}

export function useUpdateMdpeFittingsMutation(customerId: string) {
  return useCustomerMutation<MdpeFittings>(
    (values) => customersService.updateMdpeFittings(customerId, values),
    "mdpe-fittings",
  );
}

export function useUpdateCustomFieldsMutation(customerId: string) {
  return useCustomerMutation<Record<string, string | boolean>>(
    (values) => customersService.updateCustomFields(customerId, values),
    "custom-fields",
  );
}

export function useUpdateCommissioningConversionMutation(customerId: string) {
  return useCustomerMutation<CommissioningConversion>(
    (values) => customersService.updateCommissioningConversion(customerId, values),
    "commissioning-conversion",
  );
}

export function useUpdateBillingMutation(customerId: string) {
  return useCustomerMutation<BillingCompletion>(
    (values) => customersService.updateBilling(customerId, values),
    "billing",
  );
}

export function useCustomerNotesQuery(customerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.customers.notes(customerId),
    queryFn: () => customersService.listNotes(customerId as string),
    enabled: Boolean(customerId),
  });
}

export function useCreateCustomerNoteMutation(customerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (note: string) => customersService.createNote(customerId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.notes(customerId) });
    },
  });
}

export function useUpsertLmcPipeMutation(customerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (record: LmcPipeRecord) => customersService.upsertLmcPipeRecord(customerId, record),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(customerId) });
      invalidateCustomerDependents(queryClient);
    },
  });
}
