import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardOverview from '../DashboardOverview';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock api.get used by DashboardOverview
vi.mock('@/lib/api', () => ({ api: { get: vi.fn(async () => ({ students: 1, teachers: 1, parents: 1, earnings: 100 })) } }));

describe('DashboardOverview connection status badge', () => {
  it('shows connected then disconnected when socket opens then closes', async () => {
    // Mock createWebSocket to call onOpen then onClose
    vi.mock('@/lib/ws', () => ({
      createWebSocket: (onOpen: any, onMessage: any, onClose: any) => {
        setTimeout(() => onOpen && onOpen(), 0);
        setTimeout(() => onClose && onClose(), 50);
        return { close: () => {} };
      }
    }));

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <DashboardOverview />
      </QueryClientProvider>
    );

    // Initially badge will show Connecting or Connected soon
    expect(await screen.findByText(/Connected|Connecting/)).toBeTruthy();

    // Wait for close to be called and UI to reflect disconnected
    await new Promise((r) => setTimeout(r, 80));
    expect(screen.getByText(/Disconnected/)).toBeTruthy();
  });
});
