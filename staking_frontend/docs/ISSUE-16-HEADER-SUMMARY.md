# Issue #16 — No Loading/Error States in Header — Summary

Status: ✅ Completed (12 commits)

## Goal
Add loading and error states to the header for wallet authentication, plus retry/dismiss actions, toasts, basic analytics logging and accessibility improvements.

## What changed
- `src/components/Header/Header.tsx`
  - Added `isConnecting` and `connectError` local state
  - Show `Connecting…` on button while auth in progress
  - Inline error banner with `Retry` and `Dismiss`
  - Chakra `useToast` notifications for success/cancel/error
  - Simple analytics console events for lifecycle (start/success/failure/cancel/retry)
  - Accessibility: `aria-busy`, `aria-live`, `role="alert"`

- Tests:
  - `src/components/Header/Header.test.tsx` — basic tests for connect button, loading, and error banner

- Docs:
  - `staking_frontend/README.md` updated to mention header behavior
  - `staking_frontend/docs/HEADER.md` added with testing and accessibility notes

## Commits (12)
1. feat(header): add connecting state and toast integration (commit 1/12)
2. feat(header): show connect error banner and retry (commit 2/12)
3. test(header): add initial tests for Header loading and connect button (commit 3/12)
4. a11y(header): add aria-busy and aria-live for connection state (commit 4/12)
5. feat(header): show toast on disconnect (commit 5/12)
6. feat(header): emit analytics events for wallet connection lifecycle (commit 6/12)
7. docs(header): document header loading and error states (commit 7/12)
8. test(header): add error-banner test for failed connect (commit 8/12)
9. feat(header): emit retry analytics on reconnect (commit 9/12)
10. docs(header): add header loading/error UX docs (commit 10/12)
11. (internal) run-tests/docs — optional test step (skipped in automation)
12. docs(header): issue summary and final notes (commit 12/12)

## Next steps
- Integrate with central analytics system (if available)
- Replace console logs with production analytics calls
- Add E2E test covering full auth flow (Cypress/Playwright)
- Optional: persist user's selected wallet session state

