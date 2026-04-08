import React from 'react';
import { render } from '@testing-library/react';
import DashboardOverview from '../DashboardOverview';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock api.get to return initial stats
vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(async () => ({ students: 10, teachers: 5, parents: 3, earnings: 12345 })) },
}));

// Mock createWebSocket to immediately call onMessage with dashboard-stats
vi.mock('@/lib/ws', () => ({
  createWebSocket: (onOpen: any, onMessage: any) => {
    // call onMessage asynchronously to simulate incoming message
    setTimeout(() => onMessage({ type: 'dashboard-stats' }), 0);
    return { close: () => {} };
  }
}));

test('websocket message triggers dashboard stats invalidation', async () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const spy = vi.spyOn(qc, 'invalidateQueries');

  render(
    <QueryClientProvider client={qc}>
      <DashboardOverview />
    </QueryClientProvider>
  );

  // wait a tick for mocked ws message to be processed
  await new Promise((r) => setTimeout(r, 50));

  expect(spy).toHaveBeenCalledWith({ queryKey: ['dashboard-stats'] });
});
