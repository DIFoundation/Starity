;; Staking Contract - Logic Fixed
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; --- DATA VARS ---
(define-data-var contract-owner principal tx-sender)
(define-data-var is-paused bool false)
(define-data-var total-staked uint u0)
(define-data-var current-reward-rate uint u20) ;; APR Percentage
(define-constant REWARD-DIVISOR u31536000) ;; Seconds in a year (for APR)

;; --- MAPS ---
(define-map UserInfo principal {
    staked-amount: uint,
    last-update: uint,
    pending-rewards: uint
})

;; --- ERRORS ---
(define-constant ERR-PAUSED (err u101))
(define-constant ERR-NOT-OWNER (err u102))
(define-constant ERR-INSUFFICIENT-FUNDS (err u104))

;; --- PRIVATE FUNCTIONS ---

;; Calculate rewards earned since the last interaction
(define-private (calculate-rewards (user principal))
    (let (
        (data (default-to {staked-amount: u0, last-update: stacks-block-time, pending-rewards: u0} (map-get? UserInfo user)))
        (time-elapsed (- stacks-block-time (get last-update data)))
        ;; Reward = (Amount * Rate * Time) / (100 * SecondsInYear)
        (earned (/ (* (* (get staked-amount data) (var-get current-reward-rate)) time-elapsed) (* u100 REWARD-DIVISOR)))
    )
        earned
    )
)

;; --- PUBLIC FUNCTIONS ---

(define-public (stake (token <ft-trait>) (amount uint))
    (let (
        (user tx-sender)
        (earned (calculate-rewards user))
        (data (default-to {staked-amount: u0, last-update: stacks-block-time, pending-rewards: u0} (map-get? UserInfo user)))
    )
        (asserts! (not (var-get is-paused)) ERR-PAUSED)
        
        ;; 1. Transfer tokens from user to contract
        (try! (contract-call? token transfer amount user (as-contract tx-sender) none))
        
        ;; 2. Update Map (adding earned rewards to pending and resetting timer)
        (map-set UserInfo user {
            staked-amount: (+ (get staked-amount data) amount),
            last-update: stacks-block-time,
            pending-rewards: (+ (get pending-rewards data) earned)
        })
        
        (var-set total-staked (+ (var-get total-staked) amount))
        (ok true)
    )
)

(define-public (unstake (token <ft-trait>) (amount uint))
    (let (
        (user tx-sender)
        (earned (calculate-rewards user))
        (data (unwrap! (map-get? UserInfo user) ERR-INSUFFICIENT-FUNDS))
    )
        (asserts! (>= (get staked-amount data) amount) ERR-INSUFFICIENT-FUNDS)

        ;; 1. Transfer tokens back to user
        (try! (as-contract (contract-call? token transfer amount tx-sender user none)))

        ;; 2. Update Map
        (map-set UserInfo user {
            staked-amount: (- (get staked-amount data) amount),
            last-update: stacks-block-time,
            pending-rewards: (+ (get pending-rewards data) earned)
        })

        (var-set total-staked (- (var-get total-staked) amount))
        (ok true)
    )
)

;; Claim Rewards Function
(define-public (claim-rewards (token <ft-trait>))
    (let (
        (user tx-sender)
        (earned (calculate-rewards user))
        (data (unwrap! (map-get? UserInfo user) ERR-INSUFFICIENT-FUNDS))
        (total-to-claim (+ (get pending-rewards data) earned))
    )
        ;; Check if there's actually anything to claim
        (asserts! (> total-to-claim u0) (err u105))

        ;; 1. The contract mints or transfers the rewards to the user
        ;; Note: The contract must have enough STK balance or minting authority
        (try! (as-contract (contract-call? token transfer total-to-claim tx-sender user none)))

        ;; 2. Reset the user's pending rewards and update the timestamp
        (map-set UserInfo user (merge data {
            last-update: stacks-block-time,
            pending-rewards: u0
        }))

        (ok total-to-claim)
    )
)

;; --- ADMIN FUNCTIONS ---
(define-public (set-paused (status bool))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-OWNER)
        (ok (var-set is-paused status))
    )
)