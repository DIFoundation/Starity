import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock stacks connect hooks
vi.mock('@stacks/connect-react', () => ({
  useAuthRequest: () => ({ isAuthenticated: false, doOpenAuth: vi.fn(), userData: null }),
  useAccount: () => ({ address: null }),
  useConnect: () => ({ doOpenAuth: vi.fn() }),
}));

// Mock logger
vi.mock('../../services/logger', () => ({
  default: {
    logEvent: vi.fn(),
  },
}));

import Header from './Header';

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for successful network response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ network_id: 1 }),
    });
  });

  // ======= EXISTING TESTS =======
  it('shows Connect Wallet button when not authenticated', () => {
    render(<Header />);
    expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
  });

  it('shows loading state when clicking connect', async () => {
    render(<Header />);
    const btn = screen.getByRole('button', { name: /connect wallet/i });
    
    await act(async () => {
      fireEvent.click(btn);
    });
    
    // Wait for loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /connecting/i })).toBeInTheDocument();
    });
  });

  it('shows error banner when connect reports an error', async () => {
    // Override the connect mock to call onError
    vi.mocked(require('@stacks/connect-react').useConnect).mockImplementation(() => ({
      doOpenAuth: (opts: any) => {
        if (opts?.onError) opts.onError(new Error('mock failure'));
      }
    }));

    render(<Header />);
    const btn = screen.getByRole('button', { name: /connect wallet/i });
    
    await act(async () => {
      fireEvent.click(btn);
    });

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/mock failure/i)).toBeInTheDocument();
  });

  // ======= NEW TESTS FOR NETWORK ENHANCEMENT =======
  describe('Network Status Indicator', () => {
    it('shows network checking state initially', () => {
      render(<Header />);
      expect(screen.getByText(/checking network/i)).toBeInTheDocument();
    });

    it('shows connected state when network is available', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ network_id: 1 }),
      });

      render(<Header />);

      await waitFor(() => {
        expect(screen.getByText(/mainnet.*connected/i)).toBeInTheDocument();
      });
    });

    it('shows testnet when network_id indicates testnet', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ network_id: 2 }),
      });

      render(<Header />);

      await waitFor(() => {
        expect(screen.getByText(/testnet.*connected/i)).toBeInTheDocument();
      });
    });

    it('shows disconnected state when network check fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<Header />);

      await waitFor(() => {
        expect(screen.getByText(/network offline/i)).toBeInTheDocument();
      });
    });

    it('shows disconnected state when response is not ok', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
      });

      render(<Header />);

      await waitFor(() => {
        expect(screen.getByText(/network offline/i)).toBeInTheDocument();
      });
    });

    it('disables connect button when network is offline', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<Header />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /network offline/i });
        expect(button).toBeDisabled();
      });
    });

    it('shows tooltip with last checked time on hover', async () => {
      render(<Header />);

      await waitFor(() => {
        expect(screen.getByText(/mainnet.*connected/i)).toBeInTheDocument();
      });

      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('aria-label', expect.stringContaining('Network status'));
    });

    it('refreshes network status when badge is clicked', async () => {
      // First call succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ network_id: 1 }),
        })
        // Second call fails
        .mockRejectedValueOnce(new Error('Network error'));

      render(<Header />);

      // Wait for initial connected state
      await waitFor(() => {
        expect(screen.getByText(/mainnet.*connected/i)).toBeInTheDocument();
      });

      // Click badge to refresh
      const badge = screen.getByRole('status');
      await act(async () => {
        fireEvent.click(badge);
      });

      // Should show disconnected after refresh
      await waitFor(() => {
        expect(screen.getByText(/network offline/i)).toBeInTheDocument();
      });
    });

    it('prevents wallet connection when network is offline', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const mockConnect = vi.fn();
      vi.mocked(require('@stacks/connect-react').useConnect).mockImplementation(() => ({
        doOpenAuth: mockConnect,
      }));

      render(<Header />);

      await waitFor(() => {
        expect(screen.getByText(/network offline/i)).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /network offline/i });
      await act(async () => {
        fireEvent.click(button);
      });

      // Connect should not be called
      expect(mockConnect).not.toHaveBeenCalled();
    });

    it('handles network check timeout', async () => {
      // Mock a slow response that times out
      mockFetch.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 6000)));

      render(<Header />);

      // Should show checking state
      expect(screen.getByText(/checking network/i)).toBeInTheDocument();

      // Should eventually show disconnected due to timeout
      await waitFor(() => {
        expect(screen.getByText(/network offline/i)).toBeInTheDocument();
      }, { timeout: 7000 });
    });

    it('uses correct network type in connect call', async () => {
      // Mock testnet response
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ network_id: 2 }),
      });

      const mockConnect = vi.fn();
      vi.mocked(require('@stacks/connect-react').useConnect).mockImplementation(() => ({
        doOpenAuth: mockConnect,
      }));

      render(<Header />);

      await waitFor(() => {
        expect(screen.getByText(/testnet.*connected/i)).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /connect wallet/i });
      await act(async () => {
        fireEvent.click(button);
      });

      // Verify network was passed correctly
      expect(mockConnect).toHaveBeenCalledWith(
        expect.objectContaining({
          network: expect.anything(),
        })
      );
    });

    it('shows retry button when connection fails after network is online', async () => {
      // Network is online
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ network_id: 1 }),
      });

      // Mock connection error
      vi.mocked(require('@stacks/connect-react').useConnect).mockImplementation(() => ({
        doOpenAuth: (opts: any) => {
          if (opts?.onError) opts.onError(new Error('Connection failed'));
        }
      }));

      render(<Header />);

      await waitFor(() => {
        expect(screen.getByText(/mainnet.*connected/i)).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /connect wallet/i });
      await act(async () => {
        fireEvent.click(button);
      });

      // Error banner should appear with retry button
      expect(await screen.findByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });
});
