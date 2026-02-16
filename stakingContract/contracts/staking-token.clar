;; Staking Token (BTS) - Optimized SIP-010
(impl-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

(define-fungible-token staking-token)

;; --- Constants & Variables ---
(define-constant CONTRACT-OWNER tx-sender)

;; Error Codes
(define-constant ERR-OWNER-ONLY (err u100))
(define-constant ERR-NOT-TOKEN-OWNER (err u101))
(define-constant ERR-COOLDOWN (err u102))

;; Minting Params (1000 tokens per mint, 18 decimals)
(define-constant MINT-AMOUNT u1000000000000000000000) 
(define-constant MINT-COOLDOWN u86400) 

(define-map LastMintTimestamp principal uint)

;; --- Authorization Check ---
(define-private (is-owner)
    (is-eq tx-sender CONTRACT-OWNER))

(define-data-var authorized-minter principal tx-sender)

;; --- Public Functions ---

;; Minting: Now includes a check to ensure it aligns with your protocol goals
(define-public (mint)
    (let (
        (last-mint (default-to u0 (map-get? LastMintTimestamp tx-sender)))
        (current-time stacks-block-time)
    )
        ;; Ensure user waits 24 hours between mints
        (asserts! (>= current-time (+ last-mint MINT-COOLDOWN)) ERR-COOLDOWN)
        
        (try! (ft-mint? staking-token MINT-AMOUNT tx-sender))
        (map-set LastMintTimestamp tx-sender current-time)
        (ok true)
    )
)

;; Burn: Useful for staking mechanics (e.g., slashing or exiting)
(define-public (burn (amount uint) (sender principal))
    (begin
        (asserts! (is-eq tx-sender sender) ERR-NOT-TOKEN-OWNER)
        (ft-burn? staking-token amount sender)
    )
)

;; SIP-010 Transfer
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
    (begin
        ;; Security: Ensure only the token owner can invoke transfers on their behalf
        (asserts! (is-eq tx-sender sender) ERR-NOT-TOKEN-OWNER)

        (try! (ft-transfer? staking-token amount sender recipient))

        ;; Print memo if it exists
        (match memo to-print (print to-print) 0x)
        (ok true)
    )
)

(define-public (set-minter (new-minter principal))
    (begin
        (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
        (ok (var-set authorized-minter new-minter))
    )
)

;; Restricted mint for the Staking Contract
(define-public (mint-for-protocol (amount uint) (recipient principal))
    (begin
        (asserts! (is-eq tx-sender (var-get authorized-minter)) ERR-OWNER-ONLY)
        (ft-mint? staking-token amount recipient)
    )
)

;; --- Read-Only Functions ---

(define-read-only (get-balance (user principal))
    (ok (ft-get-balance staking-token user)))

(define-read-only (get-total-supply)
    (ok (ft-get-supply staking-token)))

(define-read-only (get-name)
    (ok "Staking Token"))

(define-read-only (get-symbol)
    (ok "STK"))

(define-read-only (get-decimals)
    (ok u18))

(define-read-only (get-token-uri)
    (ok none))