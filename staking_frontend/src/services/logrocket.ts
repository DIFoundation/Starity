// staking_frontend/src/services/logrocket.ts
// LogRocket integration for session replay and analytics

let logrocketLoaded = false;

export function initLogRocket(logrocketId: string | undefined) {
  if (!logrocketId || logrocketLoaded) return;
  // Dynamically import LogRocket to avoid SSR issues
  import('logrocket').then(LogRocket => {
    LogRocket.default.init(logrocketId);
    logrocketLoaded = true;
    // Optionally, tag user/session here
  }).catch(() => {
    // Ignore if LogRocket is not installed
  });
}
