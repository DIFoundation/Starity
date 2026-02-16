// staking_frontend/src/services/logger.ts
// Centralized logging and analytics service for Starity

export type LogEventData = Record<string, unknown>;
export type LogErrorContext = Record<string, unknown>;

export type TransactionStatus = 'pending' | 'success' | 'failed';

export class Logger {
  static logEvent(eventName: string, data?: LogEventData) {
    // Placeholder: implement structured event logging
    // e.g., send to analytics backend or console
    console.log('[event]', eventName, data || {});
  }

  static logError(error: Error, context?: LogErrorContext) {
    // Placeholder: implement error tracking
    // e.g., send to Sentry or error backend
    console.error('[error]', error, context || {});
  }

  static logTransaction(txHash: string, status: TransactionStatus, meta?: LogEventData) {
    // Placeholder: implement transaction tracking
    // e.g., send to analytics backend or console
    console.log('[transaction]', txHash, status, meta || {});
  }
}

export default Logger;
