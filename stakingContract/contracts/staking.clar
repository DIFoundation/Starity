;; Staking Contract - Clarity 4 Fixed
;; ---------------------------------------------------------

;; Only use the Mainnet trait reference that Clarinet fetched
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

;; --- INTERNAL: Update Reward Rate (Dynamic APR) ---
(define-private (update-reward-rate)
    (let (
        (total (var-get total-staked))
        ;; Example logic: Reduce APR by 1 for every 1000 tokens staked
        (reduction (/ total u1000000000000000000000)) 
    )
        (if (> reduction u15)
            (var-set current-reward-rate u5) ;; Floor at 5%
            (var-set current-reward-rate (- u20 reduction))
        )
    )
)

;; --- PUBLIC: Stake Tokens ---
(define-public (stake (token <ft-trait>) (amount uint))
    (let (
        (user tx-sender)
        (current-time (unwrap! (get-block-info? time (block-height)) (err u999)))
        (data (default-to {staked-amount: u0, last-stake-timestamp: current-time, pending-rewards: u0} 
                (map-get? UserInfo user)))
    )
        (asserts! (not (var-get is-paused)) ERR-PAUSED)
        
        ;; 1. Transfer tokens from user to contract
        (try! (contract-call? token transfer amount user (as-contract tx-sender) none))
        
        ;; 2. Update user's staking info
        (map-set UserInfo user (merge data {
            staked-amount: (+ (get staked-amount data) amount),
            last-stake-timestamp: current-time
        }))
        
        ;; 3. Update total staked amount
        (var-set total-staked (+ (var-get total-staked) amount))
        
        ;; 4. Update reward rate based on new total staked
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