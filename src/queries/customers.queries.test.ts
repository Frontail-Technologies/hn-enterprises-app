import type { QueryClient } from '@tanstack/react-query';

import { createTestQueryClient } from '@/testUtils/queryClient';
import { invalidateCustomerDependents } from './customers.queries';
import { queryKeys } from './keys';

// Protects the Phase B cache-sync behavior: saving a customer section should
// make the customer list/options, work, and stats views refetch, but must
// NOT re-invalidate the customer detail cache the caller just freshened via
// setQueryData - doing so would trigger an immediate, redundant refetch of
// data the mutation response already gave us. Uses a real QueryClient so
// this is testing actual invalidation behavior, not a re-implementation of it.

const clients: QueryClient[] = [];
afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
});

function setup() {
  const queryClient = createTestQueryClient();
  clients.push(queryClient);
  queryClient.setQueryData(queryKeys.customers.list('rajesh'), [{ id: 'c-1' }]);
  queryClient.setQueryData(queryKeys.customers.options(), [{ id: 'c-1' }]);
  queryClient.setQueryData(queryKeys.customers.detail('c-1'), { id: 'c-1', status: 'Active' });
  queryClient.setQueryData(queryKeys.customers.notes('c-1'), ['a note']);
  queryClient.setQueryData(queryKeys.work.queue(), [{ id: 'w-1' }]);
  queryClient.setQueryData(queryKeys.work.history('c-1'), [{ id: 'w-1' }]);
  queryClient.setQueryData(queryKeys.stats.summary, [{ id: 's-1' }]);
  return queryClient;
}

function isInvalidated(queryClient: QueryClient, key: readonly unknown[]) {
  return queryClient.getQueryState(key)?.isInvalidated ?? false;
}

describe('invalidateCustomerDependents', () => {
  it('invalidates customer list and options views', () => {
    const queryClient = setup();

    invalidateCustomerDependents(queryClient);

    expect(isInvalidated(queryClient, queryKeys.customers.list('rajesh'))).toBe(true);
    expect(isInvalidated(queryClient, queryKeys.customers.options())).toBe(true);
  });

  it('invalidates the Work module', () => {
    const queryClient = setup();

    invalidateCustomerDependents(queryClient);

    expect(isInvalidated(queryClient, queryKeys.work.queue())).toBe(true);
    expect(isInvalidated(queryClient, queryKeys.work.history('c-1'))).toBe(true);
  });

  it('invalidates Stats', () => {
    const queryClient = setup();

    invalidateCustomerDependents(queryClient);

    expect(isInvalidated(queryClient, queryKeys.stats.summary)).toBe(true);
  });

  it('does NOT invalidate the customer detail cache - it was just freshened via setQueryData', () => {
    const queryClient = setup();

    invalidateCustomerDependents(queryClient);

    expect(isInvalidated(queryClient, queryKeys.customers.detail('c-1'))).toBe(false);
    // The data itself is still there and unchanged.
    expect(queryClient.getQueryData(queryKeys.customers.detail('c-1'))).toEqual({ id: 'c-1', status: 'Active' });
  });

  it('does not touch an unrelated customer sub-resource (notes)', () => {
    const queryClient = setup();

    invalidateCustomerDependents(queryClient);

    expect(isInvalidated(queryClient, queryKeys.customers.notes('c-1'))).toBe(false);
  });
});
