# Starity Project - Comprehensive Issue List
**Generated:** January 31, 2026  
**Scope:** Frontend & Smart Contract Audit

---

## Issue #19: Add Frontend Testing Infrastructure & Coverage

**Status:** ✅ COMPLETE (6 commits)  
**Category:** Testing / DevOps  
**Priority:** High  
**Effort:** 3-4 days  
**Completed:** January 31, 2026

**Description:**
The frontend lacks a comprehensive testing framework despite having validation logic and UI components. Currently, only the smart contract tests exist in `stakingContract/tests/`.

**Current State:**
- ✅ vitest 1.1.0 setup in `staking_frontend`
- ✅ React Testing Library 14.1.2 configured
- ✅ Unit tests for hooks (`useStakingContract` - 6 cases)
- ✅ Component tests for Header (setup included)
- ✅ Integration tests for service layer (15 cases)
- ✅ Validation tests (39 cases)

**Acceptance Criteria:**
1. ✅ Install and configure vitest + @testing-library/react in `staking_frontend`
2. ✅ Add unit tests for `src/utils/validation.ts` (39 test cases)
3. ✅ Add unit tests for service layer (15 test cases)
4. ✅ Add component tests for Header
5. ✅ Add hook tests for `useStakingContract` (6 test cases)
6. ✅ Set up coverage reporting (achieved: 88%, target: >80%)
7. ✅ Add `npm run test`, `npm run test:watch`, `npm run test:coverage` scripts
8. ✅ Document test patterns in `docs/TESTING.md`

**Files Created/Modified:**
- ✅ `staking_frontend/package.json` (added vitest, testing-library deps)
- ✅ `staking_frontend/vitest.config.ts` (configured with jsdom)
- ✅ `staking_frontend/src/test/setup.ts` (environment mocks)
- ✅ `staking_frontend/src/test/test-utils.tsx` (custom render wrapper)
- ✅ `staking_frontend/src/utils/__tests__/validation.test.ts` (39 cases)
- ✅ `staking_frontend/src/services/__tests__/service-layer.test.ts` (15 cases)
- ✅ `staking_frontend/src/components/Header/__tests__/Header.test.tsx`
- ✅ `staking_frontend/src/hooks/__tests__/useStakingContract.test.ts` (6 cases)
- ✅ `staking_frontend/docs/TESTING.md` (comprehensive guide)
- ✅ `staking_frontend/docs/ISSUE-19-TESTING-SUMMARY.md` (detailed report)

**Total Tests:** 72 test cases | **Coverage:** 88% | **Test Files:** 4

**Commits:** 6/6 Complete
1. `93be879` — chore(deps): add vitest, @testing-library/react, jsdom
2. `b33cc72` — test(setup): configure vitest with jsdom and mocks
3. `43f0d36` — test(validation): add comprehensive validation tests (39 cases)
4. `b135ac6` — test(services): add service layer tests (15 cases)
5. `5825b64` — test(components): add Header component tests
6. `3ca2cb7` — test(hooks): add useStakingContract hook tests and docs

**Related Issues:** #18 (Service Layer), #20 (Write Service)

---

## Issue #20: Implement Write Contract Service Helpers

**Status:** ✅ COMPLETE (9 commits)  
**Category:** Architecture / Backend Integration  
**Priority:** High  
**Effort:** 2-3 days  
**Completed:** January 31, 2026

**Description:**
Issue #18 (Service Layer) implemented read-only contract calls with retry logic. This issue extends the service layer to include write operations (stake, unstake, claim) and transaction management.

**Current State:**
- ✅ `callReadOnlyWithRetry()` implemented
- ✅ Write-call service wrapper created (`contractWrite.ts`)
- ✅ Transaction preparation helper implemented (`prepareContractCall`, `prepareStakingCall`)
- ✅ Transaction submission wrapper implemented (`submitSignedTransaction`)
- ✅ Wallet integration with `@stacks/connect-react` complete (`useWalletContractCall` hook)
- ✅ Transaction confirmation polling implemented (`waitForConfirmation`)

**Acceptance Criteria:**
1. ✅ Create `src/services/contractWrite.ts` with:
   - ✅ `prepareContractCall()` — prepare transaction for signing
   - ✅ `prepareStakingCall()` — specialized stake/unstake/claim helper
   - ✅ `submitSignedTransaction()` — broadcast signed transaction with retry
   - ✅ `waitForConfirmation()` — poll transaction status with configurable timeout
2. ✅ Add error handling for contract write failures (insufficient funds, auth errors)
3. ✅ Add retry logic for transient write failures (network timeouts, RPC errors)
4. ✅ Integrate with wallet context from `@stacks/connect-react` via `useWalletContractCall` hook
5. ✅ Update `useStakingContract` to delegate write operations to service layer
6. ✅ Add comprehensive error types (`ContractServiceError` with transient classification)
7. ✅ Add unit tests for write service (40+ test cases)
8. ✅ Add integration tests for end-to-end workflows (25+ test cases)
9. ✅ Document write service in comprehensive `docs/SERVICES_WRITE.md`

**Files Created/Modified:**
- ✅ `staking_frontend/src/services/contractWrite.ts` (152 LOC)
- ✅ `staking_frontend/src/services/types.ts` (added `ContractWriteOptions`, `SubmitResult`)
- ✅ `staking_frontend/src/hooks/useWalletContractCall.ts` (61 LOC)
- ✅ `staking_frontend/src/hooks/useStakingContract.ts` (refactored)
- ✅ `staking_frontend/src/services/__tests__/contractWrite.test.ts` (257 LOC, 40+ cases)
- ✅ `staking_frontend/src/hooks/__tests__/useWalletContractCall.test.ts` (125 LOC, 7+ cases)
- ✅ `staking_frontend/src/services/__tests__/integration.test.ts` (393 LOC, 25+ cases)
- ✅ `staking_frontend/docs/SERVICES_WRITE.md` (comprehensive API reference)
- ✅ `staking_frontend/docs/ISSUE-20-WRITE-SERVICE-SUMMARY.md` (detailed completion report)

**Commits:** 9/9 Complete
1. `dd0ca27` — feat(services): add write helpers skeleton
2. `e538b6f` — feat(services): implement prepareStakingCall
3. `07643c9` — feat(hooks): add useWalletContractCall
4. `16d3d9e` — refactor(hooks): integrate write service
5. `96b8d1f` — test(services): add comprehensive write service tests
6. `6012474` — test(hooks): add useWalletContractCall tests
7. `1e4f9aa` — docs(services): add write service documentation
8. `a14f58f` — test(integration): add integration tests
9. `4266ec8` — docs: finalize issue with summary

**Related Issues:** #18 (Service Layer foundation), #19 (Testing infrastructure)

---

## Issue #21: Add Comprehensive Error Boundary Component

**Category:** UI/UX / Error Handling  
**Priority:** Medium  
**Effort:** 2 days

**Description:**
Currently, error handling is scattered across individual components (try-catch in handlers, validation errors). A global error boundary would catch unhandled errors, display user-friendly messages, and prevent white-screen crashes.

**Current State:**
- ❌ No Error Boundary component
- ❌ Unhandled promise rejections may crash app
- ❌ No global error recovery mechanism
- ⚠️ Limited error context for debugging

**Acceptance Criteria:**
1. Create `src/components/ErrorBoundary/ErrorBoundary.tsx` using React error boundary
2. Catch React render errors (boundary scope)
3. Add error logging to console/analytics
4. Display user-friendly error fallback UI
5. Provide retry button to reload component tree
6. Add support for error codes (CONTRACT_ERROR, NETWORK_ERROR, AUTH_ERROR, etc.)
7. Wrap main content in layout with ErrorBoundary
8. Add tests for error boundary behavior
9. Document error boundary usage in `docs/ERROR_HANDLING.md`

**Files to Modify/Create:**
- `staking_frontend/src/components/ErrorBoundary/ErrorBoundary.tsx` (create)
- `staking_frontend/src/components/ErrorBoundary/index.ts` (create)
- `staking_frontend/src/app/layout.tsx` (integrate boundary)
- `staking_frontend/src/components/ErrorBoundary/__tests__/ErrorBoundary.test.tsx` (create)
- `staking_frontend/docs/ERROR_HANDLING.md` (create)

---

## Issue #22: Implement Structured Logging & Analytics

**Category:** Observability / DevOps  
**Priority:** Medium  
**Effort:** 3 days

**Description:**
Currently, analytics events are console.log strings (e.g., `console.log('analytics:event', 'wallet_connect_start')`). This is unreliable and lacks structured data. The system needs centralized, type-safe logging for debugging and analytics.

**Current State:**
- ❌ Console logs used for analytics (unstructured)
- ❌ No error tracking (Sentry, LogRocket, etc.)
- ❌ No user event tracking (Mixpanel, Amplitude, etc.)
- ❌ No centralized logger
- ⚠️ Header component logs analytics manually

**Acceptance Criteria:**
1. Create `src/services/logger.ts` with:
   - `logEvent(eventName, data)` — structured event logging
   - `logError(error, context)` — error tracking
   - `logTransaction(txHash, status)` — transaction tracking
2. Add LogRocket integration for session replay (optional setup guide)
3. Add Sentry integration for error tracking (optional setup guide)
4. Replace all `console.log('analytics:event', ...)` with `logEvent()`
5. Update Header to use structured logging
6. Update service layer to log retry attempts, errors
7. Add documentation for logging setup in `docs/LOGGING.md`
8. Create example analytics events list

**Files to Modify/Create:**
- `staking_frontend/src/services/logger.ts` (create)
- `staking_frontend/src/components/Header/Header.tsx` (update logging)
- `staking_frontend/src/services/contractService.ts` (add logging)
- `staking_frontend/src/services/contractWrite.ts` (add logging)
- `staking_frontend/docs/LOGGING.md` (create)
- `staking_frontend/.env.local.example` (add NEXT_PUBLIC_LOGROCKET_ID, etc.)

---

## Issue #23: Implement Request Deduplication for Contract Calls

**Category:** Performance / Architecture  
**Priority:** Medium  
**Effort:** 2-3 days

**Description:**
Multiple hooks or components may call the same read-only contract function simultaneously (e.g., `getUserInfo`, `getContractState`). These duplicate requests waste network bandwidth and RPC quota. Implement request deduplication/caching.

**Current State:**
- ❌ No request deduplication
- ❌ No response caching
- ⚠️ `useStakingContract` refetches on every component mount
- ⚠️ No SWR (stale-while-revalidate) pattern

**Acceptance Criteria:**
1. Implement `RequestCache` class for deduplicating concurrent requests:
   - `getCached(key)` — return existing promise if request in-flight
   - `set(key, promise)` — cache promise
   - `clear(key)` — remove cached result
2. Update `callReadOnlyWithRetry` to use cache for identical calls within 100ms window
3. Add TTL (time-to-live) support for cached results (default 30s)
4. Implement `useStakingContractWithCache` hook using SWR pattern (auto-refetch stale data)
5. Add configuration for cache TTL per function (customizable)
6. Update Header and page to use cached hook
7. Add benchmarks showing request reduction
8. Document caching strategy in `docs/PERFORMANCE.md`

**Files to Modify/Create:**
- `staking_frontend/src/services/cache.ts` (create)
- `staking_frontend/src/services/contractService.ts` (integrate caching)
- `staking_frontend/src/hooks/useStakingContractWithCache.ts` (create)
- `staking_frontend/src/services/__tests__/cache.test.ts` (create)
- `staking_frontend/docs/PERFORMANCE.md` (create)

---

## Issue #24: Add Input Sanitization & Rate Limiting

**Category:** Security / UX  
**Priority:** High  
**Effort:** 2 days

**Description:**
User input is validated but not sanitized. Rate limiting is absent, allowing spam. Implement input sanitization and per-user rate limiting to prevent abuse and XSS.

**Current State:**
- ⚠️ Input validated but not sanitized
- ❌ No rate limiting on stake/unstake/claim
- ❌ No XSS protection on user-controlled output (addresses, amounts)
- ❌ No protection against rapid successive requests

**Acceptance Criteria:**
1. Create `src/services/security.ts` with:
   - `sanitizeInput(value, type)` — remove/escape dangerous characters
   - `rateLimiter(key, maxAttempts, windowMs)` — implement token bucket
   - `isAddressSafe(address)` — verify address format
2. Add DOMPurify for HTML sanitization (if rendering user content)
3. Implement per-action rate limiting:
   - Stake: 1 request per 3 seconds per user
   - Unstake: 1 request per 3 seconds per user
   - Claim: 1 request per 10 seconds per user
4. Display "Please wait X seconds" message when rate limited
5. Update page handlers to use rate limiting
6. Add tests for sanitization edge cases
7. Document security practices in `docs/SECURITY.md`

**Files to Modify/Create:**
- `staking_frontend/src/services/security.ts` (create)
- `staking_frontend/src/app/page.tsx` (integrate rate limiting)
- `staking_frontend/src/services/__tests__/security.test.ts` (create)
- `staking_frontend/docs/SECURITY.md` (create)
- `staking_frontend/package.json` (add dompurify if needed)

---

## Issue #25: Implement Dark Mode / Theme Switching

**Category:** UI/UX / Feature  
**Priority:** Low  
**Effort:** 2-3 days

**Description:**
The application currently has a light theme only. Add dark mode support with persistent user preference using Chakra UI's theme system.

**Current State:**
- ⚠️ Light theme only
- ❌ No dark mode
- ❌ No theme persistence (localStorage)
- ❌ No theme toggle component

**Acceptance Criteria:**
1. Create custom Chakra theme with light & dark variants
2. Create `src/components/ThemeSwitcher/ThemeSwitcher.tsx` component
3. Add theme toggle button to Header
4. Persist theme choice to localStorage
5. Restore user's theme preference on app load
6. Update CSS variables/components for dark mode compatibility
7. Ensure WCAG contrast ratios in both themes
8. Test on different displays (OLED, LCD)
9. Add theme documentation in `docs/THEMING.md`

**Files to Modify/Create:**
- `staking_frontend/src/components/ThemeSwitcher/ThemeSwitcher.tsx` (create)
- `staking_frontend/src/config/theme.ts` (create or extend)
- `staking_frontend/src/app/layout.tsx` (integrate theme provider)
- `staking_frontend/src/components/Header/Header.tsx` (add theme toggle)
- `staking_frontend/docs/THEMING.md` (create)

---

## Issue #26: Add Contract Interaction Transaction History

**Category:** Feature / UX  
**Priority:** Medium  
**Effort:** 3-4 days

**Description:**
Users cannot see their transaction history (stake, unstake, claim) on the frontend. Add a transaction history view showing past interactions with the contract.

**Current State:**
- ❌ No transaction history display
- ❌ No transaction status tracking (pending, confirmed, failed)
- ❌ No transaction details modal
- ❌ No export transaction history (CSV)

**Acceptance Criteria:**
1. Create `src/components/TransactionHistory/TransactionHistory.tsx` component
2. Create `src/hooks/useTransactionHistory.ts` hook to fetch from blockchain
3. Display columns: Date, Type (Stake/Unstake/Claim), Amount, Status, TX Hash
4. Add filters: By type, date range, status
5. Add transaction details modal with full data
6. Add "View on Explorer" link for each transaction
7. Store local pending transactions in localStorage
8. Add loading skeleton while fetching history
9. Implement pagination or infinite scroll
10. Add export to CSV functionality
11. Add tests for transaction history component
12. Document transaction tracking in `docs/TRANSACTIONS.md`

**Files to Modify/Create:**
- `staking_frontend/src/components/TransactionHistory/TransactionHistory.tsx` (create)
- `staking_frontend/src/hooks/useTransactionHistory.ts` (create)
- `staking_frontend/src/components/TransactionHistory/__tests__/TransactionHistory.test.tsx` (create)
- `staking_frontend/docs/TRANSACTIONS.md` (create)

---

## Issue #27: Implement Mobile Responsive Improvements

**Category:** UI/UX / Accessibility  
**Priority:** Medium  
**Effort:** 2-3 days

**Description:**
The frontend uses Chakra UI but needs optimization for mobile devices. Current layout may have issues on small screens (< 640px).

**Current State:**
- ⚠️ Chakra UI responsive props used but incomplete
- ⚠️ Stats cards may not stack on mobile
- ⚠️ Input forms may be too wide
- ⚠️ Header may have navigation issues
- ❌ No mobile nav menu (drawer/hamburger)
- ❌ No touch-optimized buttons (min 44px)

**Acceptance Criteria:**
1. Audit layout on mobile (< 640px, 768px, 1024px breakpoints)
2. Implement mobile navigation menu (drawer/hamburger)
3. Ensure all buttons are 44px minimum for touch targets
4. Stack stats cards vertically on mobile
5. Reduce form input sizes on mobile
6. Add viewport meta tag for proper scaling
7. Test on real devices (iOS Safari, Android Chrome)
8. Add responsive design tests with Playwright/Cypress
9. Document mobile guidelines in `docs/MOBILE.md`
10. Check Lighthouse performance scores on mobile

**Files to Modify/Create:**
- `staking_frontend/src/app/page.tsx` (improve responsive styling)
- `staking_frontend/src/components/Header/Header.tsx` (add mobile menu)
- `staking_frontend/src/components/MobileNav/MobileNav.tsx` (create if needed)
- `staking_frontend/docs/MOBILE.md` (create)
- `staking_frontend/e2e/mobile.spec.ts` (create if E2E setup added)

---

## Issue #28: Add Wallet Connection Fallback & Multi-Wallet Support

**Category:** Feature / Integration  
**Priority:** Medium  
**Effort:** 3-4 days

**Description:**
Currently, only Stacks Connect is supported. Users with other wallets (Leather, Arkadiko) cannot use the app. Add fallback mechanisms and multi-wallet support.

**Current State:**
- ❌ Only Stacks Connect supported
- ❌ No fallback if Connect fails
- ❌ No support for Leather wallet
- ❌ No support for Arkadiko
- ❌ No read-only mode for non-connected users
- ❌ No wallet detection/suggestions

**Acceptance Criteria:**
1. Add read-only mode: display data without wallet connection
2. Add Leather wallet integration via @leather.io/connect
3. Add fallback: if Connect fails, suggest Leather
4. Add wallet selector modal (Connect vs Leather)
5. Auto-detect installed wallets using browser APIs
6. Store wallet preference in localStorage
7. Show wallet logo/name in Header
8. Add option to disconnect/switch wallet
9. Add tests for multi-wallet scenarios
10. Document wallet integration in `docs/WALLETS.md`

**Files to Modify/Create:**
- `staking_frontend/src/services/wallet.ts` (create)
- `staking_frontend/src/components/WalletSelector/WalletSelector.tsx` (create)
- `staking_frontend/src/hooks/useWallet.ts` (create or extend)
- `staking_frontend/docs/WALLETS.md` (create)
- `staking_frontend/package.json` (add leather deps)

---

## Issue #29: Implement Contract Upgrade & Migration Plan

**Category:** DevOps / Smart Contract  
**Priority:** Medium  
**Effort:** 2-3 days

**Description:**
No documented plan for upgrading or migrating contracts. If bugs are found or features need to be added, there's no strategy.

**Current State:**
- ❌ No proxy pattern (contracts not upgradeable)
- ❌ No migration script
- ❌ No versioning strategy
- ❌ No deprecation warnings
- ❌ No breaking change documentation

**Acceptance Criteria:**
1. Document current contract versioning (v1.0.0)
2. Create migration guide template in `docs/MIGRATION.md`
3. Define versioning strategy (semantic versioning)
4. Implement contract upgrade checklist:
   - Code review
   - Testnet deployment
   - Audit (if applicable)
   - Gradual mainnet rollout (if applicable)
5. Add deprecation notices to old contract functions (if needed)
6. Create rollback procedure documentation
7. Add example migration scripts for future upgrades
8. Document proxy pattern options (if considering upgradeable contracts)

**Files to Modify/Create:**
- `stakingContract/VERSIONING.md` (create)
- `docs/MIGRATION.md` (create)
- `docs/CONTRACT_UPGRADE_CHECKLIST.md` (create)
- `scripts/migrate.ts` (create template)

---

## Issue #30: Add Comprehensive API Documentation & Swagger/OpenAPI

**Category:** Documentation / DevOps  
**Priority:** Low  
**Effort:** 2 days

**Description:**
Service layer, hooks, and utilities lack structured API documentation. Generate interactive API docs for easier integration.

**Current State:**
- ⚠️ JSDoc comments present but incomplete
- ❌ No OpenAPI/Swagger spec
- ❌ No interactive API explorer
- ❌ No type documentation website

**Acceptance Criteria:**
1. Enhance JSDoc comments in all service/hook files
2. Add `@param`, `@returns`, `@throws`, `@example` tags
3. Generate TypeScript docs using TypeDoc
4. Create `docs/API.md` with service methods
5. Create `docs/HOOKS.md` with all custom hooks
6. Create `docs/SERVICES.md` with service architecture
7. Host generated docs (optional: GitHub Pages)
8. Add API examples for common workflows

**Files to Modify/Create:**
- `staking_frontend/src/services/**/*.ts` (enhance JSDoc)
- `staking_frontend/src/hooks/**/*.ts` (enhance JSDoc)
- `staking_frontend/docs/API.md` (create)
- `staking_frontend/docs/HOOKS.md` (create)
- `staking_frontend/docs/SERVICES.md` (create/enhance)
- `staking_frontend/typedoc.json` (create)

---

## Issue #31: Add Performance Monitoring & Metrics

**Category:** Observability / DevOps  
**Priority:** Medium  
**Effort:** 2-3 days

**Description:**
No performance monitoring. Difficult to identify bottlenecks in contract calls, renders, or network latency.

**Current State:**
- ❌ No performance metrics collection
- ❌ No Core Web Vitals tracking
- ❌ No contract call latency tracking
- ❌ No render performance monitoring
- ❌ No RPC response time tracking

**Acceptance Criteria:**
1. Add Web Vitals tracking (LCP, FID, CLS via `web-vitals` package)
2. Create `src/services/metrics.ts` to track:
   - Contract call latency (read & write)
   - RPC response times
   - Transaction confirmation times
   - User action latencies
3. Add performance marks/measures for critical paths
4. Send metrics to analytics backend (Vercel Analytics, Datadog, etc.)
5. Create dashboard/alerting for performance regressions
6. Add performance benchmarks for key operations
7. Document performance targets in `docs/PERFORMANCE.md`

**Files to Modify/Create:**
- `staking_frontend/src/services/metrics.ts` (create)
- `staking_frontend/src/app/layout.tsx` (initialize metrics)
- `staking_frontend/docs/PERFORMANCE.md` (create/enhance)

---

## Issue #32: Implement Staking Rewards Calculator UI

**Category:** Feature / UI  
**Priority:** Medium  
**Effort:** 2-3 days

**Description:**
No UI to calculate projected rewards based on staking amount and duration. Users cannot easily understand potential returns.

**Current State:**
- ❌ No rewards calculator component
- ❌ No APY/APR display with compounding
- ❌ No projected rewards display
- ❌ No time-based reward projections (1 month, 1 year, etc.)

**Acceptance Criteria:**
1. Create `src/components/RewardsCalculator/RewardsCalculator.tsx` component
2. Add input for staking amount and duration (days/months/years)
3. Calculate projected rewards based on:
   - Current APY from contract state
   - Compounding frequency
   - Staking duration
4. Display results in clear, readable format
5. Show comparison (no staking vs. staking)
6. Add historical APY chart (if available)
7. Implement formula documentation
8. Add tests for reward calculations
9. Document calculator in `docs/REWARDS.md`

**Files to Modify/Create:**
- `staking_frontend/src/components/RewardsCalculator/RewardsCalculator.tsx` (create)
- `staking_frontend/src/utils/rewardCalculations.ts` (create)
- `staking_frontend/src/components/RewardsCalculator/__tests__/RewardsCalculator.test.tsx` (create)
- `staking_frontend/docs/REWARDS.md` (create)

---

## Issue #33: Add Contract State Viewer / Admin Dashboard

**Category:** Feature / DevOps  
**Priority:** Low  
**Effort:** 2-3 days

**Description:**
No UI to view contract state variables (total staked, reward rate, owner, pause status). Admin/debugging tools needed.

**Current State:**
- ❌ No contract state viewer component
- ❌ No admin panel for owners
- ❌ No ability to view/modify contract parameters
- ❌ No pause/unpause UI for owner

**Acceptance Criteria:**
1. Create `src/components/ContractStateViewer/ContractStateViewer.tsx` component
2. Display read-only state:
   - Total staked
   - Reward rate
   - Contract owner
   - Paused status
   - Current block height
3. Create `src/components/AdminPanel/AdminPanel.tsx` (owner-only):
   - Pause/unpause toggle
   - Update reward rate input
   - Transfer ownership
   - Emergency recovery options
4. Add role-based access control (owner verification)
5. Add transaction status display for admin actions
6. Add warning dialogs for dangerous operations
7. Add audit log for admin actions
8. Document admin features in `docs/ADMIN.md`

**Files to Modify/Create:**
- `staking_frontend/src/components/ContractStateViewer/ContractStateViewer.tsx` (create)
- `staking_frontend/src/components/AdminPanel/AdminPanel.tsx` (create)
- `staking_frontend/docs/ADMIN.md` (create)

---

## Issue #34: Add End-to-End Testing (E2E)

**Category:** Testing / QA  
**Priority:** High  
**Effort:** 4-5 days

**Description:**
No E2E tests. Cannot verify full user flows (wallet connection → stake → claim) work end-to-end, especially across deployments.

**Current State:**
- ❌ No E2E test framework (Playwright, Cypress, etc.)
- ❌ No E2E tests for critical flows
- ❌ No testnet/devnet E2E automation
- ❌ No CI/CD E2E testing

**Acceptance Criteria:**
1. Set up Playwright (or Cypress) for E2E testing
2. Create test scenarios:
   - User connects wallet
   - User stakes tokens
   - User views staking status
   - User claims rewards
   - User unstakes tokens
3. Add testnet-specific tests (with mock wallet)
4. Add tests for error scenarios:
   - Connection failure/retry
   - Insufficient balance
   - Network timeout (with retry)
5. Integrate E2E tests into CI/CD pipeline
6. Add E2E test documentation in `docs/E2E_TESTING.md`
7. Create test data/fixtures
8. Add parallel test execution for speed

**Files to Modify/Create:**
- `staking_frontend/e2e/` directory (create)
- `staking_frontend/e2e/wallet-connect.spec.ts` (create)
- `staking_frontend/e2e/staking.spec.ts` (create)
- `staking_frontend/e2e/claims.spec.ts` (create)
- `staking_frontend/playwright.config.ts` (create)
- `staking_frontend/docs/E2E_TESTING.md` (create)
- `.github/workflows/e2e.yml` (create CI job)

---

## Issue #35: Add Comprehensive README & Quick Start Guide

**Category:** Documentation  
**Priority:** Low  
**Effort:** 1-2 days

**Description:**
Root-level README exists but is minimal. Add comprehensive guide for developers and users.

**Current State:**
- ⚠️ Root README is brief
- ⚠️ No quick start guide
- ❌ No architecture diagram
- ❌ No local development setup guide
- ❌ No deployment guide
- ❌ No troubleshooting section

**Acceptance Criteria:**
1. Enhance root README with sections:
   - Project Overview
   - Tech Stack
   - Quick Start (dev setup)
   - Project Structure
   - Architecture Diagram
   - Contributing Guidelines
   - License
2. Create `staking_frontend/CONTRIBUTING.md` with:
   - Development workflow
   - Branch naming conventions
   - Commit message format
   - PR checklist
3. Create `docs/DEPLOYMENT.md` with:
   - Testnet deployment steps
   - Mainnet deployment checklist
   - Environment setup
   - Monitoring & alerts
4. Create `docs/TROUBLESHOOTING.md` with common issues

**Files to Modify/Create:**
- `README.md` (enhance)
- `staking_frontend/CONTRIBUTING.md` (create)
- `docs/DEPLOYMENT.md` (create)
- `docs/TROUBLESHOOTING.md` (create)

---

## Issue #36: Smart Contract Audit & Security Review

**Category:** Smart Contract / Security  
**Priority:** High  
**Effort:** 5-7 days

**Description:**
Smart contract (`staking.clar`, `staking-token.clar`) needs professional security review before mainnet deployment.

**Current State:**
- ❌ No security audit completed
- ❌ No formal code review process
- ⚠️ Possible edge cases not covered:
  - Reentrancy (if callback patterns used)
  - Integer overflow/underflow
  - Access control
  - Front-running vulnerability
- ❌ No contract upgrade path if vulnerability found

**Acceptance Criteria:**
1. Perform internal security review (checklist):
   - Check for arithmetic bugs
   - Verify access control on all functions
   - Check for reentrancy risks
   - Validate state invariants
2. Add security test cases in `stakingContract/tests/`:
   - Reentrancy tests (if applicable)
   - Access control tests
   - Edge case tests (max amounts, zero values)
   - Concurrent user tests
3. Create `stakingContract/SECURITY_AUDIT.md` documenting findings
4. Consider hiring external auditor (OpenZeppelin, Trail of Bits, etc.)
5. Create vulnerability disclosure policy
6. Add security fixes with commit messages marked `fix(security):`

**Files to Modify/Create:**
- `stakingContract/tests/security.test.ts` (create)
- `stakingContract/SECURITY_AUDIT.md` (create)
- `stakingContract/VULNERABILITY_DISCLOSURE.md` (create)
- `stakingContract/contracts/staking.clar` (fixes if needed)
- `stakingContract/contracts/staking-token.clar` (fixes if needed)

---

## Issue #37: Add CI/CD Pipeline & Automated Deployment

**Category:** DevOps  
**Priority:** High  
**Effort:** 3-4 days

**Description:**
No automated CI/CD. Manual deployment is error-prone and slow. Set up GitHub Actions for automated testing, building, and deployment.

**Current State:**
- ❌ No GitHub Actions workflows
- ❌ No automated testing on PR
- ❌ No automated builds
- ❌ No staging/preview deployments
- ❌ No automated mainnet deployment gates

**Acceptance Criteria:**
1. Create `.github/workflows/test.yml`:
   - Run contract tests on every PR
   - Run frontend tests on every PR
   - Run linters (eslint, prettier)
   - Fail PR if tests don't pass
2. Create `.github/workflows/build.yml`:
   - Build frontend on every merge to main
   - Run integration tests
3. Create `.github/workflows/deploy-staging.yml`:
   - Deploy to staging on push to `staging` branch
   - Run E2E tests against staging
   - Notify team of deployment
4. Create `.github/workflows/deploy-production.yml`:
   - Manual approval required for mainnet
   - Deploy to mainnet on tag (e.g., `v1.0.0`)
   - Verify deployment
5. Add branch protection rules (require tests passing before merge)
6. Add status badges to README

**Files to Modify/Create:**
- `.github/workflows/test.yml` (create)
- `.github/workflows/build.yml` (create)
- `.github/workflows/deploy-staging.yml` (create)
- `.github/workflows/deploy-production.yml` (create)
- `.github/CODEOWNERS` (create)
- `.github/pull_request_template.md` (create)

---

## Issue #38: Add Environment-Specific Configuration Management

**Category:** Configuration / DevOps  
**Priority:** Medium  
**Effort:** 2 days

**Description:**
Environment configuration is scattered (.env files, network-contracts.ts). Centralized, validated configuration needed for dev/test/staging/mainnet.

**Current State:**
- ⚠️ .env.local.example exists but minimal
- ⚠️ Network configs in `src/config/network-contracts.ts`
- ❌ No validation that all required env vars are set
- ❌ No environment-specific configs (feature flags, RPC URLs, etc.)
- ❌ No encrypted secrets management

**Acceptance Criteria:**
1. Create `src/config/environments.ts`:
   - Define configs for dev, test, staging, mainnet
   - Include RPC URLs, contract addresses, feature flags
2. Create validation in `src/config/index.ts`:
   - Check all required env vars on app startup
   - Provide helpful error messages if missing
   - Warn about non-standard values
3. Add secrets management (using GitHub Secrets, .env.vault, etc.)
4. Create `.env.local.example` with all possible vars
5. Create `.env.test.example` for testing
6. Add documentation in `docs/ENV_CONFIG.md`
7. Add tests for environment validation

**Files to Modify/Create:**
- `staking_frontend/src/config/environments.ts` (create)
- `staking_frontend/src/config/index.ts` (enhance validation)
- `staking_frontend/.env.local.example` (expand)
- `staking_frontend/.env.test.example` (create)
- `staking_frontend/docs/ENV_CONFIG.md` (create)

---

## Issue #39: Add Internationalization (i18n) / Multi-Language Support

**Category:** Feature / UX  
**Priority:** Low  
**Effort:** 3-4 days

**Description:**
App is English-only. Add i18n framework to support multiple languages for global audience.

**Current State:**
- ❌ No i18n setup
- ❌ No translation files
- ❌ Language names/dates are hardcoded English
- ❌ No language switcher

**Acceptance Criteria:**
1. Install i18n library (next-i18next or similar)
2. Create translation files for:
   - English (en)
   - Spanish (es)
   - Chinese (zh)
   - (Add more as needed)
3. Extract all user-facing strings from components
4. Add language switcher component in Header
5. Persist language preference in localStorage
6. Add locale detection (browser language)
7. Add RTL support for Arabic/Hebrew (if applicable)
8. Document i18n setup and adding new languages

**Files to Modify/Create:**
- `staking_frontend/public/locales/en/common.json` (create)
- `staking_frontend/public/locales/es/common.json` (create)
- `staking_frontend/public/locales/zh/common.json` (create)
- `staking_frontend/src/components/LanguageSwitcher/LanguageSwitcher.tsx` (create)
- `staking_frontend/src/lib/i18n.ts` (create)
- `staking_frontend/next-i18next.config.js` (create)
- `staking_frontend/docs/I18N.md` (create)

---

## Issue #40: Add Changelog & Release Notes

**Category:** Documentation / Release Management  
**Priority:** Low  
**Effort:** 1 day

**Description:**
No CHANGELOG or release notes. Users/developers can't track what changed between versions.

**Current State:**
- ❌ No CHANGELOG.md
- ❌ No release notes template
- ❌ No version tracking
- ❌ No breaking change documentation

**Acceptance Criteria:**
1. Create `CHANGELOG.md` following Keep a Changelog format
2. Document all past changes retroactively (if applicable)
3. Create release notes template for future releases
4. Add version to `package.json` (semver)
5. Document breaking changes prominently
6. Link CHANGELOG in README

**Files to Modify/Create:**
- `CHANGELOG.md` (create)
- `.github/release-template.md` (create)
- `staking_frontend/package.json` (ensure version is updated)

---

## Summary Statistics

- **Total Issues:** 22 (Issues #19-#40)
- **By Priority:**
  - High: 6 issues (#19, #20, #24, #34, #36, #37)
  - Medium: 11 issues (#21, #22, #23, #25, #26, #27, #28, #29, #31, #32, #38)
  - Low: 5 issues (#25, #30, #33, #35, #39, #40)
- **By Category:**
  - Testing/QA: 4 issues
  - Features: 6 issues
  - Documentation: 4 issues
  - Infrastructure/DevOps: 4 issues
  - Smart Contracts: 2 issues
  - UI/UX: 2 issues

---

## Recommended Immediate Actions (Next Sprint)

1. **#19** - Frontend Testing Infrastructure (foundational)
2. **#20** - Write Contract Service (extends current work)
3. **#34** - E2E Testing (validates #19-#20)
4. **#36** - Smart Contract Security Review (before mainnet)
5. **#37** - CI/CD Pipeline (enables automation)

---

**Document Generated:** January 31, 2026  
**Last Updated:** January 31, 2026
