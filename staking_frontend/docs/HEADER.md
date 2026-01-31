# Header Loading & Error States

This document explains the header's wallet connection UX and how to test it.

## Behaviors

- Clicking `Connect Wallet` begins the auth flow and sets the button to `Connecting…`.
- If the user cancels or the flow fails, an inline error banner appears with `Retry` and `Dismiss` actions.
- Toast notifications appear for success, cancellation and errors.

## Testing

1. Start the app locally:

```bash
NEXT_PUBLIC_STACKS_NETWORK=devnet npm run dev
```

2. Click `Connect Wallet` in the header.
3. If you cancel the auth in the wallet popup, the banner will show `Connection cancelled by user`.
4. If connect fails (e.g. RPC/network issue), the banner will show the error message and allow `Retry`.

## Accessibility

- Inline error uses `role="alert"` and `aria-live="assertive"`.
- The Connect button uses `aria-busy` and an `aria-live` region for dynamic text.

## Developer notes

- The header uses Chakra UI `useToast` for transient notifications.
- Simple analytics events are logged to console for connection lifecycle (start/success/failure/cancel/retry).

