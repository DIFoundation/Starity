import { initSentry, captureSentryError } from './sentry';
import { initLogRocket } from './logrocket';
// staking_frontend/src/services/logger.ts
// Centralized logging and analytics service for Starity

export type LogEventData = Record<string, unknown>;
export type LogErrorContext = Record<string, unknown>;

export type TransactionStatus = 'pending' | 'success' | 'failed';

export class Logger {
      static initializeAll() {
        // Optionally initialize LogRocket and Sentry if env variables are set
        if (typeof window !== 'undefined') {
          const logrocketId = process.env.NEXT_PUBLIC_LOGROCKET_ID;
          if (logrocketId) {
            initLogRocket(logrocketId);
          }
          const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
          if (sentryDsn) {
            initSentry(sentryDsn);
          }
        }
      }
    static initialize() {
      // Optionally initialize LogRocket if env variable is set
      if (typeof window !== 'undefined') {
        const logrocketId = process.env.NEXT_PUBLIC_LOGROCKET_ID;
        if (logrocketId) {
          initLogRocket(logrocketId);
        }
      }
    }
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
    // Integrate with Sentry if available
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      captureSentryError(error, context);
    }
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
