# Logging & Analytics Setup for Starity

This document describes the logging and analytics infrastructure for the Starity project.

## Overview
- Centralized logger service (`src/services/logger.ts`) for all analytics, error, and transaction events
- Optional integrations: LogRocket (session replay), Sentry (error tracking)
- All analytics events are structured and type-safe

## Environment Variables
Add these to your `.env.local`:

```
NEXT_PUBLIC_LOGROCKET_ID=your-logrocket-id
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

## Logger API
- `Logger.logEvent(eventName: string, data?: object)` — Log analytics events
- `Logger.logError(error: Error, context?: object)` — Log errors
- `Logger.logTransaction(txHash: string, status: 'pending'|'success'|'failed', meta?: object)` — Log transaction status
- `Logger.initializeAll()` — Initialize LogRocket and Sentry if configured

## Integrations
- **LogRocket**: Session replay and analytics. Only initialized if `NEXT_PUBLIC_LOGROCKET_ID` is set.
- **Sentry**: Error tracking. Only initialized if `NEXT_PUBLIC_SENTRY_DSN` is set.

## Usage Examples
```ts
Logger.logEvent('wallet_connect_start');
Logger.logError(new Error('Something went wrong'), { context: 'Header' });
Logger.logTransaction('0xabc...', 'success', { action: 'stake' });
```

## Analytics Events List (Examples)
- `wallet_connect_start`
- `wallet_connect_success`
- `wallet_connect_cancel`
- `wallet_connect_failure`
- `prepare_contract_call`
- `prepare_staking_call`
- `read_only_call_start`
- `read_only_call_success`

## Best Practices
- Use structured data for all events
- Avoid direct `console.log`/`console.error` for analytics
- Use Logger for all user, error, and transaction events

---

For more details, see the code in `src/services/logger.ts`, `src/services/logrocket.ts`, and `src/services/sentry.ts`.
