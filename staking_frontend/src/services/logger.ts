// staking_frontend/src/services/logger.ts
// Centralized logging and analytics service for Starity

export type LogEventData = Record<string, unknown>;
export type LogErrorContext = Record<string, unknown>;

export type TransactionStatus = 'pending' | 'success' | 'failed';

export class Logger {
  static logEvent(eventName: string, data?: LogEventData) {
    // Structured event logging: add timestamp, event name, and data
    const eventPayload = {
      type: 'event',
      timestamp: new Date().toISOString(),
      event: eventName,
      data: data || {},
    };
    // TODO: Integrate with analytics backend (Mixpanel, Amplitude, etc.)
    // For now, log to console in a structured way
    console.log('[analytics:event]', JSON.stringify(eventPayload));
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
