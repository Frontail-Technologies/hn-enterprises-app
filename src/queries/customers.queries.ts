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
    // Keep the current results on screen while a new search term fetches,
    // instead of blanking to a loading state on each keystroke.
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
    // Keep the previously loaded pages visible while a changed search term
    // refetches, so the grid doesn't flash its skeleton on every keystroke.
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

// Shared by every customer-section save and the LMC pipe upsert below - all
// change a customer record that the customer list, Work, and Stats depend on.
//
// Deliberately does NOT invalidate `customers.detail` - the caller already
// has the fresh record from the mutation response and applies it directly
// via `setQueryData`, so invalidating that same key here would trigger an
// immediate, redundant refetch of data we already have.
export function invalidateCustomerDependents(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.customers.allLists });
  queryClient.invalidateQueries({ queryKey: queryKeys.customers.allOptions });
  queryClient.invalidateQueries({ queryKey: queryKeys.work.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
}

// `label` is a fixed, developer-authored form identifier for Sentry breadcrumbs only (e.g.
// "survey", "gi-measurements") - every one of this app's customer-section save mutations already
// funnels through this one wrapper, so instrumenting FORMS submit started/succeeded/failed here
// covers all of them without touching any of the individual section panel files.
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
      // Unlike `useCustomerMutation`, this mutation's response is just the
      // pipe record, not the full customer - so unlike that helper, the
      // detail cache genuinely does need a refetch here, not just a
      // `setQueryData`.
      await queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(customerId) });
      invalidateCustomerDependents(queryClient);
    },
  });
}
