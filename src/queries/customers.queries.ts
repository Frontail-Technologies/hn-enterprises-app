import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { customersService } from "@/services/customers.service";
import type {
  BillingCompletion,
  CommissioningConversion,
  CustomerRecord,
  FittingsAccessories,
  GiMeasurements,
  IsolationFittings,
  LmcPipeRecord,
  LmcPipelineWork,
  MdpeFittings,
} from "@/services/mockData";
import { queryKeys } from "./keys";

export function useCustomerListQuery(search?: string) {
  return useQuery({
    queryKey: queryKeys.customers.list(search),
    queryFn: () => customersService.list(search),
  });
}

const CUSTOMER_PAGE_SIZE = 100;

export function useCustomerInfiniteListQuery(search?: string) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.customers.list(search), "infinite"],
    queryFn: ({ pageParam }) => customersService.listPage({ page: pageParam, limit: CUSTOMER_PAGE_SIZE, search }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages ? lastPage.pagination.page + 1 : undefined,
  });
}

export function useCustomerQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => customersService.get(id as string),
    enabled: Boolean(id),
  });
}

function useCustomerMutation<TBody>(mutationFn: (body: TBody) => Promise<CustomerRecord>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (customer) => {
      queryClient.setQueryData(queryKeys.customers.detail(customer.id), customer);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["work"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useUpdateSurveyMutation(customerId: string) {
  return useCustomerMutation<CustomerRecord["survey"]>((survey) => customersService.updateSurvey(customerId, survey));
}

export function useUpdateGiMeasurementsMutation(customerId: string) {
  return useCustomerMutation<GiMeasurements>((values) => customersService.updateGiMeasurements(customerId, values));
}

export function useUpdateIsolationRegulatorsMutation(customerId: string) {
  return useCustomerMutation<IsolationFittings>((values) => customersService.updateIsolationRegulators(customerId, values));
}

export function useUpdateFittingsAccessoriesMutation(customerId: string) {
  return useCustomerMutation<FittingsAccessories>((values) => customersService.updateFittingsAccessories(customerId, values));
}

export function useUpdateCivilWorkMutation(customerId: string) {
  return useCustomerMutation<Omit<LmcPipelineWork, "pipeRecords">>((values) =>
    customersService.updateCivilWork(customerId, values),
  );
}

export function useUpdateMdpeFittingsMutation(customerId: string) {
  return useCustomerMutation<MdpeFittings>((values) => customersService.updateMdpeFittings(customerId, values));
}

export function useUpdateCustomFieldsMutation(customerId: string) {
  return useCustomerMutation<Record<string, string | boolean>>((values) =>
    customersService.updateCustomFields(customerId, values),
  );
}

export function useUpdateCommissioningConversionMutation(customerId: string) {
  return useCustomerMutation<CommissioningConversion>((values) =>
    customersService.updateCommissioningConversion(customerId, values),
  );
}

export function useUpdateBillingMutation(customerId: string) {
  return useCustomerMutation<BillingCompletion>((values) => customersService.updateBilling(customerId, values));
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
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["work"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}
