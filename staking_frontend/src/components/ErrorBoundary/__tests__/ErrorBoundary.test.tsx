import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { ErrorBoundary, ErrorFallback, ErrorCode } from '../ErrorBoundary';
import { ReactNode } from 'react';

// Suppress console.error during tests
const suppressConsoleError = () => {
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });
};

// Test component that throws an error
const ThrowError: React.FC<{ message?: string }> = ({ message = 'Test error' }) => {
  throw new Error(message);
};

// Test component that does NOT throw
const SafeComponent = () => <div>Safe content</div>;

const renderWithChakra = (component: ReactNode) => {
  return render(<ChakraProvider>{component}</ChakraProvider>);
};

describe('ErrorBoundary', () => {
  suppressConsoleError();

  describe('Basic Functionality', () => {
    it('should render children when there is no error', () => {
      renderWithChakra(
        <ErrorBoundary>
          <SafeComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Safe content')).toBeInTheDocument();
    });

    it('should display error fallback when child throws error', () => {
      renderWithChakra(
        <ErrorBoundary>
          <ThrowError message="Test error message" />
        </ErrorBoundary>
      );

      expect(
        screen.getByText(/a rendering error occurred in the application/i)
      ).toBeInTheDocument();
    });

    it('should show error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      renderWithChakra(
        <ErrorBoundary>
          <ThrowError message="Test error" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Test error')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should hide error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      renderWithChakra(
        <ErrorBoundary>
          <ThrowError message="Secret error" />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Secret error')).not.toBeInTheDocument();
      expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error Classification', () => {
    it('should classify contract errors', () => {
      renderWithChakra(
        <ErrorBoundary>
          <ThrowError message="Contract execution failed" />
        </ErrorBoundary>
      );

      expect(
        screen.getByText(/Failed to interact with the smart contract/i)
      ).toBeInTheDocument();
    });

    it('should classify wallet errors', () => {
      renderWithChakra(
        <ErrorBoundary>
          <ThrowError message="Wallet signer rejected" />
        </ErrorBoundary>
      );

      expect(
        screen.getByText(/wallet operation failed|A wallet operation failed/i)
      ).toBeInTheDocument();
    });

    it('should classify network errors', () => {
      renderWithChakra(
        <ErrorBoundary>
          <ThrowError message="Network timeout occurred" />
        </ErrorBoundary>
      );

      expect(
        screen.getByText(/A network error occurred/i)
      ).toBeInTheDocument();
    });

    it('should classify auth errors', () => {
      renderWithChakra(
        <ErrorBoundary>
          <ThrowError message="Authentication failed" />
        </ErrorBoundary>
      );

      expect(
        screen.getByText(/Authentication failed/i)
      ).toBeInTheDocument();
    });

    it('should classify unknown errors as RENDER_ERROR', () => {
      renderWithChakra(
        <ErrorBoundary>
          <ThrowError message="Random unknown error" />
        </ErrorBoundary>
      );

      expect(
        screen.getByText(/rendering error occurred/i)
      ).toBeInTheDocument();
    });
  });

  describe('Reset Functionality', () => {
    it('should reset error boundary when reset button is clicked', () => {
      const { rerender } = renderWithChakra(
        <ErrorBoundary>
          <SafeComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Safe content')).toBeInTheDocument();

      // Simulate error by re-rendering with throwing component
      rerender(
        <ChakraProvider>
          <ErrorBoundary>
            <ThrowError message="Test error" />
          </ErrorBoundary>
        </ChakraProvider>
      );

      expect(screen.getByText(/rendering error occurred/i)).toBeInTheDocument();

      // Click reset button
      const resetButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(resetButton);

      // Re-render with safe component
      rerender(
        <ChakraProvider>
          <ErrorBoundary>
            <SafeComponent />
          </ErrorBoundary>
        </ChakraProvider>
      );

      expect(screen.getByText('Safe content')).toBeInTheDocument();
    });

    it('should trigger full page reload on hardReload button click', () => {
      const reloadSpy = vi.spyOn(global.location, 'reload').mockImplementation();

      renderWithChakra(
        <ErrorBoundary>
          <ThrowError message="Test error" />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByRole('button', { name: /reload page/i });
      fireEvent.click(reloadButton);

      expect(reloadSpy).toHaveBeenCalled();

      reloadSpy.mockRestore();
    });
  });

  describe('Error Handler Callback', () => {
    it('should call onError callback when error is caught', () => {
      const mockOnError = vi.fn();

      renderWithChakra(
        <ErrorBoundary onError={mockOnError}>
          <ThrowError message="Test error for callback" />
        </ErrorBoundary>
      );

      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test error for callback' }),
        expect.objectContaining({ componentStack: expect.any(String) })
      );
    });

    it('should not crash if onError callback throws', () => {
      const mockOnError = vi.fn(() => {
        throw new Error('Callback error');
      });

      expect(() => {
        renderWithChakra(
          <ErrorBoundary onError={mockOnError}>
            <ThrowError message="Test error" />
          </ErrorBoundary>
        );
      }).not.toThrow();

      expect(screen.getByText(/rendering error occurred/i)).toBeInTheDocument();
    });
  });

  describe('Custom Fallback', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = <div>Custom error display</div>;

      renderWithChakra(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError message="Test error" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error display')).toBeInTheDocument();
      expect(screen.queryByText(/rendering error occurred/i)).not.toBeInTheDocument();
    });

    it('should use default fallback when custom fallback not provided', () => {
      renderWithChakra(
        <ErrorBoundary>
          <ThrowError message="Test error" />
        </ErrorBoundary>
      );

      expect(
        screen.getByText(/rendering error occurred/i)
      ).toBeInTheDocument();
    });
  });

  describe('ResetKeys Support', () => {
    it('should reset error when resetKeys change', () => {
      const { rerender } = renderWithChakra(
        <ErrorBoundary resetKeys={['key1']}>
          <ThrowError message="Test error" />
        </ErrorBoundary>
      );

      expect(screen.getByText(/rendering error occurred/i)).toBeInTheDocument();

      // Change resetKeys to trigger auto-reset
      rerender(
        <ChakraProvider>
          <ErrorBoundary resetKeys={['key2']}>
            <SafeComponent />
          </ErrorBoundary>
        </ChakraProvider>
      );

      expect(screen.getByText('Safe content')).toBeInTheDocument();
      expect(screen.queryByText(/rendering error occurred/i)).not.toBeInTheDocument();
    });

    it('should not reset when resetKeys remain the same', () => {
      const { rerender } = renderWithChakra(
        <ErrorBoundary resetKeys={['key1']}>
          <ThrowError message="Test error" />
        </ErrorBoundary>
      );

      expect(screen.getByText(/rendering error occurred/i)).toBeInTheDocument();

      // Rerender with same resetKeys - should NOT reset
      rerender(
        <ChakraProvider>
          <ErrorBoundary resetKeys={['key1']}>
            <ThrowError message="Different error" />
          </ErrorBoundary>
        </ChakraProvider>
      );

      // Error boundary should still be showing error
      expect(screen.getByText(/rendering error occurred/i)).toBeInTheDocument();
    });
  });

  describe('Error Logging', () => {
    it('should log error to window.__logger if available', () => {
      const mockLogger = {
        logError: vi.fn(),
      };
      (window as any).__logger = mockLogger;

      renderWithChakra(
        <ErrorBoundary>
          <ThrowError message="Test error" />
        </ErrorBoundary>
      );

      expect(mockLogger.logError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test error' }),
        expect.objectContaining({ errorCode: 'RENDER_ERROR' })
      );

      delete (window as any).__logger;
    });

    it('should handle missing logger gracefully', () => {
      delete (window as any).__logger;

      expect(() => {
        renderWithChakra(
          <ErrorBoundary>
            <ThrowError message="Test error" />
          </ErrorBoundary>
        );
      }).not.toThrow();

      expect(screen.getByText(/rendering error occurred/i)).toBeInTheDocument();
    });
  });

  describe('Multiple Nested Boundaries', () => {
    it('should allow multiple error boundaries to coexist', () => {
      renderWithChakra(
        <ErrorBoundary>
          <div>
            <SafeComponent />
            <ErrorBoundary>
              <ThrowError message="Nested error" />
            </ErrorBoundary>
          </div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Safe content')).toBeInTheDocument();
      expect(screen.getByText(/rendering error occurred/i)).toBeInTheDocument();
    });

    it('should isolate errors to their respective boundaries', () => {
      renderWithChakra(
        <ErrorBoundary>
          <ThrowError message="Outer error" />
          <ErrorBoundary>
            <SafeComponent />
          </ErrorBoundary>
        </ErrorBoundary>
      );

      // Only outer error should be shown
      expect(screen.getByText(/rendering error occurred/i)).toBeInTheDocument();
      expect(screen.queryByText('Safe content')).not.toBeInTheDocument();
    });
  });
});

describe('ErrorFallback Component', () => {
  suppressConsoleError();

  it('should render with proper structure', () => {
    const mockReset = vi.fn();
    const mockHardReload = vi.fn();

    render(
      <ChakraProvider>
        <ErrorFallback
          error={new Error('Test error')}
          errorCode="UNKNOWN_ERROR"
          errorInfo={null}
          onReset={mockReset}
          onHardReload={mockHardReload}
        />
      </ChakraProvider>
    );

    expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
  });

  it('should call onReset when reset button clicked', () => {
    const mockReset = vi.fn();

    render(
      <ChakraProvider>
        <ErrorFallback
          error={new Error('Test')}
          errorCode="UNKNOWN_ERROR"
          errorInfo={null}
          onReset={mockReset}
          onHardReload={vi.fn()}
        />
      </ChakraProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(mockReset).toHaveBeenCalled();
  });

  it('should call onHardReload when reload button clicked', () => {
    const mockHardReload = vi.fn();

    render(
      <ChakraProvider>
        <ErrorFallback
          error={new Error('Test')}
          errorCode="UNKNOWN_ERROR"
          errorInfo={null}
          onReset={vi.fn()}
          onHardReload={mockHardReload}
        />
      </ChakraProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /reload page/i }));
    expect(mockHardReload).toHaveBeenCalled();
  });

  it('should render custom fallback when provided', () => {
    render(
      <ChakraProvider>
        <ErrorFallback
          error={new Error('Test')}
          errorCode="UNKNOWN_ERROR"
          errorInfo={null}
          onReset={vi.fn()}
          onHardReload={vi.fn()}
          fallback={<div>Custom fallback content</div>}
        />
      </ChakraProvider>
    );

    expect(screen.getByText('Custom fallback content')).toBeInTheDocument();
  });
})