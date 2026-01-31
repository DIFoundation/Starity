import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

// Mock stacks connect hooks
vi.mock('@stacks/connect-react', () => ({
  useAuthRequest: () => ({ isAuthenticated: false, doOpenAuth: vi.fn(), userData: null }),
  useAccount: () => ({ address: null }),
  useConnect: () => ({ doOpenAuth: vi.fn() }),
}));

import Header from './Header';

describe('Header', () => {
  it('shows Connect Wallet button when not authenticated', () => {
    render(<Header />);
    expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
  });

  it('shows loading state when clicking connect', () => {
    render(<Header />);
    const btn = screen.getByRole('button', { name: /connect wallet/i });
    fireEvent.click(btn);
    // After clicking we expect to see 'Connecting' text appear or button disabled
    expect(screen.getByRole('button', { name: /connecting/i })).toBeInTheDocument();
  });
});
