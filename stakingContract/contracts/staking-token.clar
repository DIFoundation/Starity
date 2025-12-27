;; Staking Token (BTS) - SIP-010 Compliant
(impl-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

(define-fungible-token staking-token)

;; Constants
(define-constant MINT-AMOUNT u1000000000000000000000) ;; 1000 * 10^18
(define-constant MINT-COOLDOWN u86400) ;; 1 day in seconds
(define-constant ERR-COOLDOWN (err u100))

;; Data Maps
(define-map LastMintTimestamp principal uint)

;; Public Mint Function (Clarity 4)
(define-public (mint)
    (let (
        (last-mint (default-to u0 (map-get? LastMintTimestamp tx-sender)))
        (current-time stacks-block-time) ;; Clarity 4 Keyword
    )
        (asserts! (>= current-time (+ last-mint MINT-COOLDOWN)) ERR-COOLDOWN)
        
        (try! (ft-mint? staking-token MINT-AMOUNT tx-sender))
        (map-set LastMintTimestamp tx-sender current-time)
        (ok true)
    )
)

;; SIP-010 Required Functions
(define-read-only (get-balance (user principal)) (ok (ft-get-balance staking-token user)))
(define-read-only (get-total-supply) (ok (ft-get-supply staking-token)))
(define-read-only (get-name) (ok "Staking-token"))
(define-read-only (get-symbol) (ok "STK"))
(define-read-only (get-decimals) (ok u18))
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
    (begin
        (asserts! (is-eq tx-sender sender) (err u101))
        (try! (ft-transfer? staking-token amount sender recipient))
        (match memo to-print (print to-print) 0x)
        (ok true)
    )
)