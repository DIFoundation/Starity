// staking_frontend/src/services/sentry.ts
// Sentry integration for error tracking

let sentryLoaded = false;

export function initSentry(sentryDsn: string | undefined) {
  if (!sentryDsn || sentryLoaded) return;
  // Dynamically import Sentry to avoid SSR issues
  import('@sentry/browser').then(Sentry => {
    Sentry.init({ dsn: sentryDsn });
    sentryLoaded = true;
  }).catch(() => {
    // Ignore if Sentry is not installed
  });
}

export function captureSentryError(error: Error, context?: Record<string, unknown>) {
  if (!sentryLoaded) return;
  import('@sentry/browser').then(Sentry => {
    Sentry.captureException(error, { extra: context });
  });
}
