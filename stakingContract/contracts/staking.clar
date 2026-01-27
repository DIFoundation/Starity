;; Staking Contract - Clarity 4 Fixed Version
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; --- DATA VARS ---
(define-data-var contract-owner principal tx-sender)
(define-data-var is-paused bool false)
(define-data-var total-staked uint u0)
(define-data-var current-reward-rate uint u20) ;; Initial APR
(define-data-var min-lock-duration uint u86400) ;; 1 day

;; --- MAPS ---
(define-map UserInfo principal {
    staked-amount: uint,
    last-stake-timestamp: uint,
    pending-rewards: uint
})

;; --- ERRORS ---
(define-constant ERR-PAUSED (err u101))
(define-constant ERR-NOT-OWNER (err u102))
(define-constant ERR-LOCK-ACTIVE (err u103))

;; --- PRIVATE FUNCTIONS ---
(define-private (update-reward-rate)
    (let (
        (total (var-get total-staked))
        (reduction (/ total u1000000000000000000000)) 
    )
        (if (> reduction u15)
            (var-set current-reward-rate u5)
            (var-set current-reward-rate (- u20 reduction))
        )
    )
)

;; --- PUBLIC FUNCTIONS ---
(define-public (stake (token <ft-trait>) (amount uint))
    (let (
        (user tx-sender)
        (current-time stacks-block-time) ;; FIXED: Replace get-block-info?
        (data (default-to {staked-amount: u0, last-stake-timestamp: current-time, pending-rewards: u0} 
                (map-get? UserInfo user)))
    )
        ;; FIXED SCOPING: Everything below is now INSIDE the 'let' block
        (asserts! (not (var-get is-paused)) ERR-PAUSED)
        
        ;; 1. Transfer tokens
        (try! (contract-call? token transfer amount user (as-contract tx-sender) none))
        
        ;; 2. Update Map
        (map-set UserInfo user (merge data {
            staked-amount: (+ (get staked-amount data) amount),
            last-stake-timestamp: current-time
        }))
        
        ;; 3. Update Totals
        (var-set total-staked (+ (var-get total-staked) amount))
        (update-reward-rate)
        
        (ok true)
    )
)

;; --- ADMIN FUNCTIONS ---
(define-public (set-paused (status bool))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-OWNER)
        (ok (var-set is-paused status))
    )
)

;; --- GETTER FUNCTIONS ---
(define-read-only (token-balance (amount uint))
    ()
)