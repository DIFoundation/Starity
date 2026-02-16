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
    // Structured error tracking: add timestamp, error details, and context
    const errorPayload = {
      type: 'error',
      timestamp: new Date().toISOString(),
      name: error.name,
      message: error.message,
      stack: error.stack,
      context: context || {},
    };
    // TODO: Integrate with Sentry or error tracking backend
    // For now, log to console in a structured way
    console.error('[analytics:error]', JSON.stringify(errorPayload));
  }

  static logTransaction(txHash: string, status: TransactionStatus, meta?: LogEventData) {
    // Structured transaction tracking: add timestamp, txHash, status, and meta
    const txPayload = {
      type: 'transaction',
      timestamp: new Date().toISOString(),
      txHash,
      status,
      meta: meta || {},
    };
    // TODO: Integrate with analytics backend
    // For now, log to console in a structured way
    console.log('[analytics:transaction]', JSON.stringify(txPayload));
  }
}

export default Logger;
