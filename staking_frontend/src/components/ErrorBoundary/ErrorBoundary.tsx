'use client';

import React, { ReactNode } from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorMode,
  Code,
  Divider,
} from '@chakra-ui/react';

export type ErrorCode =
  | 'RENDER_ERROR'
  | 'CONTRACT_ERROR'
  | 'NETWORK_ERROR'
  | 'AUTH_ERROR'
  | 'WALLET_ERROR'
  | 'UNKNOWN_ERROR';

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorCode: ErrorCode;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  RENDER_ERROR: 'A rendering error occurred in the application.',
  CONTRACT_ERROR: 'Failed to interact with the smart contract.',
  NETWORK_ERROR: 'A network error occurred. Please check your connection.',
  AUTH_ERROR: 'Authentication failed. Please reconnect your wallet.',
  WALLET_ERROR: 'A wallet operation failed.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
};

const ERROR_DESCRIPTIONS: Record<ErrorCode, string> = {
  RENDER_ERROR: 'The application encountered an error while rendering UI components.',
  CONTRACT_ERROR: 'Unable to complete the contract interaction. Check your wallet and try again.',
  NETWORK_ERROR: 'Unable to connect to the network. Please verify your internet connection.',
  AUTH_ERROR: 'Your wallet session expired or disconnected. Please reconnect and try again.',
  WALLET_ERROR: 'Your wallet rejected the transaction or is not properly configured.',
  UNKNOWN_ERROR: 'Something went wrong. Please try refreshing the page.',
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCode: 'UNKNOWN_ERROR',
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error details for debugging
    console.error('ErrorBoundary caught error:', error);
    console.error('Error Info:', errorInfo);

    // Determine error code based on error message
    const errorCode = this.classifyError(error);

    // Update state with error details
    this.setState({
      errorCode,
      errorInfo,
    });

    // Call user-provided error handler if available
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log event for analytics (if logger available)
    try {
      const logger = (window as any).__logger;
      if (logger?.logError) {
        logger.logError(error, {
          errorCode,
          componentStack: errorInfo.componentStack,
        });
      }
    } catch {
      // Ignore logger errors
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset error boundary if resetKeys changed
    if (
      this.state.hasError &&
      this.props.resetKeys &&
      prevProps.resetKeys &&
      this.hasResetKeyChanged()
    ) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount(): void {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private hasResetKeyChanged(): boolean {
    const { resetKeys: currentKeys } = this.props;
    const prevKeys = (this as any).prevResetKeys;

    if (!currentKeys) return false;
    if (!prevKeys) {
      (this as any).prevResetKeys = currentKeys;
      return false;
    }

    return currentKeys.some((key, index) => key !== prevKeys[index]);
  }

  private classifyError(error: Error): ErrorCode {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('contract') || stack.includes('contract')) {
      return 'CONTRACT_ERROR';
    }
    if (message.includes('wallet') || message.includes('signer')) {
      return 'WALLET_ERROR';
    }
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout')
    ) {
      return 'NETWORK_ERROR';
    }
    if (message.includes('auth') || message.includes('unauthorized')) {
      return 'AUTH_ERROR';
    }

    return 'RENDER_ERROR';
  }

  private resetErrorBoundary = (): void => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorCode: 'UNKNOWN_ERROR',
      errorInfo: null,
    });
  };

  private hardReload = (): void => {
    // Hard reload to reset entire app state
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorCode={this.state.errorCode}
          errorInfo={this.state.errorInfo}
          onReset={this.resetErrorBoundary}
          onHardReload={this.hardReload}
          fallback={this.props.fallback}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  errorCode: ErrorCode;
  errorInfo: React.ErrorInfo | null;
  onReset: () => void;
  onHardReload: () => void;
  fallback?: ReactNode;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorCode,
  errorInfo,
  onReset,
  onHardReload,
  fallback,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Use custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg={isDark ? 'gray.900' : 'gray.50'}
      px={4}
    >
      <VStack spacing={8} maxW="600px" w="full">
        {/* Error Alert */}
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="flex-start"
          borderRadius="lg"
          boxShadow="md"
        >
          <HStack mb={2}>
            <AlertIcon boxSize={6} />
            <AlertTitle fontSize="lg" fontWeight="bold">
              {ERROR_MESSAGES[errorCode]}
            </AlertTitle>
          </HStack>
          <AlertDescription fontSize="sm" ml={8}>
            {ERROR_DESCRIPTIONS[errorCode]}
          </AlertDescription>
        </Alert>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && error && (
          <Box
            w="full"
            p={4}
            bg={isDark ? 'gray.800' : 'gray.100'}
            borderRadius="md"
            borderLeft="4px solid"
            borderColor="red.500"
          >
            <VStack align="start" spacing={3}>
              <Box>
                <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>
                  Error:
                </Text>
                <Code
                  p={2}
                  borderRadius="sm"
                  fontSize="xs"
                  whiteSpace="pre-wrap"
                  wordBreak="break-word"
                  display="block"
                  bg={isDark ? 'gray.700' : 'gray.200'}
                >
                  {error.message}
                </Code>
              </Box>

              {errorInfo?.componentStack && (
                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>
                    Component Stack:
                  </Text>
                  <Code
                    p={2}
                    borderRadius="sm"
                    fontSize="xs"
                    whiteSpace="pre-wrap"
                    wordBreak="break-word"
                    display="block"
                    bg={isDark ? 'gray.700' : 'gray.200'}
                    maxH="200px"
                    overflowY="auto"
                  >
                    {errorInfo.componentStack}
                  </Code>
                </Box>
              )}

              <Text fontSize="xs" color="gray.500">
                Error Code: <Code>{errorCode}</Code>
              </Text>
            </VStack>
          </Box>
        )}

        <Divider />

        {/* Action Buttons */}
        <HStack spacing={4} w="full" justify="center">
          <Button
            colorScheme="blue"
            size="lg"
            onClick={onReset}
            fontWeight="bold"
          >
            Try Again
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onHardReload}
            fontWeight="bold"
          >
            Reload Page
          </Button>
        </HStack>

        {/* Help Text */}
        <Text fontSize="sm" color="gray.500" textAlign="center">
          If the problem persists, please clear your browser cache or contact support.
        </Text>
      </VStack>
    </Box>
  );
};

export default ErrorBoundary;
