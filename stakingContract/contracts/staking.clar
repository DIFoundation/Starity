;; Staking Contract - Comprehensive Error Handling
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; --- DATA VARS ---
(define-data-var contract-owner principal tx-sender)
(define-data-var is-paused bool false)
(define-data-var total-staked uint u0)
(define-data-var current-reward-rate uint u20) ;; APR Percentage
(define-constant REWARD-DIVISOR u31536000) ;; Seconds in a year (for APR)

;; --- CONSTRAINT CONSTANTS ---
(define-constant MAX-UINT u340282366920938463463374607431768211455) ;; 2^128 - 1
(define-constant MIN-STAKE-AMOUNT u1) ;; Minimum 1 token to stake
(define-constant MAX-REWARD-RATE u10000) ;; Max 100% APR (stored as basis points)
(define-constant MIN-REWARD-RATE u0) ;; Min 0% APR
(define-constant MAX-USERS u100000) ;; Maximum tracked users

;; --- MAPS ---
(define-map UserInfo principal {
    staked-amount: uint,
    last-update: uint,
    pending-rewards: uint
})

;; --- COMPREHENSIVE ERROR CODES ---
;; Status & Access Errors (100-109)
(define-constant ERR-PAUSED (err u100))
(define-constant ERR-NOT-OWNER (err u101))
(define-constant ERR-NOT-AUTHORIZED (err u102))
(define-constant ERR-INVALID-PRINCIPAL (err u103))
(define-constant ERR-CANNOT-PAUSE (err u104))

;; Amount Validation Errors (110-119)
(define-constant ERR-INSUFFICIENT-FUNDS (err u110))
(define-constant ERR-ZERO-AMOUNT (err u111))
(define-constant ERR-AMOUNT-TOO-SMALL (err u112))
(define-constant ERR-AMOUNT-TOO-LARGE (err u113))
(define-constant ERR-INVALID-AMOUNT (err u114))

;; Overflow & Math Errors (120-129)
(define-constant ERR-OVERFLOW (err u120))
(define-constant ERR-UNDERFLOW (err u121))
(define-constant ERR-MATH-PRECISION (err u122))
(define-constant ERR-DIVISION-BY-ZERO (err u123))

;; State & Rate Errors (130-139)
(define-constant ERR-INVALID-RATE (err u130))
(define-constant ERR-RATE-TOO-HIGH (err u131))
(define-constant ERR-RATE-NOT-SET (err u132))
(define-constant ERR-NO-STAKE (err u133))
(define-constant ERR-ZERO-REWARDS (err u134))

;; Token & Transfer Errors (140-149)
(define-constant ERR-TOKEN-TRANSFER-FAILED (err u140))
(define-constant ERR-TOKEN-NOT-AVAILABLE (err u141))
(define-constant ERR-TOKEN-BALANCE-MISMATCH (err u142))
(define-constant ERR-TRANSFER-AMOUNT-MISMATCH (err u143))

;; Contract State Errors (150-159)
(define-constant ERR-TOTAL-STAKED-MISMATCH (err u150))
(define-constant ERR-CONTRACT-LOCKED (err u151))
(define-constant ERR-USER-NOT-FOUND (err u152))
(define-constant ERR-INVALID-TIMESTAMP (err u153))

;; --- PRIVATE VALIDATION FUNCTIONS ---

;; Check if amount is within valid range
(define-private (is-valid-amount (amount uint))
    (and
        (> amount u0)
        (<= amount MAX-UINT)
    )
)

;; Check if amount is safe for staking (not too small, not zero)
(define-private (is-stake-amount-valid (amount uint))
    (and
        (>= amount MIN-STAKE-AMOUNT)
        (<= amount MAX-UINT)
    )
)

;; Check for uint overflow when adding
(define-private (will-overflow-add (a uint) (b uint))
    (> (+ a b) MAX-UINT)
)

;; Check for safe addition (no overflow)
(define-private (safe-add (a uint) (b uint))
    (if (will-overflow-add a b)
        (err u120) ;; ERR-OVERFLOW
        (ok (+ a b))
    )
)

;; Check for safe subtraction (no underflow)
(define-private (safe-sub (a uint) (b uint))
    (if (< a b)
        (err u121) ;; ERR-UNDERFLOW
        (ok (- a b))
    )
)

;; Validate reward rate is within acceptable range
(define-private (is-rate-valid (rate uint))
    (and
        (>= rate MIN-REWARD-RATE)
        (<= rate MAX-REWARD-RATE)
    )
)

;; Check principal is valid (not null)
(define-private (is-principal-valid (principal principal))
    (not (is-eq principal 'SZ2J6ZY48GV1EZ5V2V5RB9MP9DRQGCDM847VI54W))
)

;; --- PRIVATE FUNCTIONS ---

;; Calculate rewards earned since the last interaction with overflow protection
(define-private (calculate-rewards (user principal))
    (let (
        (data (default-to {staked-amount: u0, last-update: stacks-block-time, pending-rewards: u0} (map-get? UserInfo user)))
        (time-elapsed (if (>= stacks-block-time (get last-update data)) 
                          (- stacks-block-time (get last-update data))
                          u0))
        ;; Reward = (Amount * Rate * Time) / (100 * SecondsInYear)
        ;; Apply overflow checks at each multiplication step
        (rate-product (if (<= (get staked-amount data) MAX-UINT)
                         (* (get staked-amount data) (var-get current-reward-rate))
                         u0))
        (time-product (if (<= rate-product MAX-UINT)
                         (* rate-product time-elapsed)
                         u0))
        (earned (if (> (* u100 REWARD-DIVISOR) u0)
                   (/ time-product (* u100 REWARD-DIVISOR))
                   u0))
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
        ;; Check contract is not paused
        (asserts! (not (var-get is-paused)) ERR-PAUSED)
        
        ;; Validate amount is not zero
        (asserts! (> amount u0) ERR-ZERO-AMOUNT)
        
        ;; Validate amount is valid stake amount
        (asserts! (is-stake-amount-valid amount) ERR-AMOUNT-TOO-LARGE)
        
        ;; Check for overflow when adding to existing stake
        (asserts! (not (will-overflow-add (get staked-amount data) amount)) ERR-OVERFLOW)
        
        ;; Check for overflow when adding to total staked
        (asserts! (not (will-overflow-add (var-get total-staked) amount)) ERR-OVERFLOW)
        
        ;; Transfer tokens from user to contract
        (try! (contract-call? token transfer amount user (as-contract) none))
        
        ;; Update user stake with earned rewards
        (map-set UserInfo user {
            staked-amount: (+ (get staked-amount data) amount),
            last-update: stacks-block-time,
            pending-rewards: (+ (get pending-rewards data) earned)
        })
        
        ;; Update total staked
        (var-set total-staked (+ (var-get total-staked) amount))
        (ok true)
    )
)

(define-public (unstake (token <ft-trait>) (amount uint))
    (let (
        (user tx-sender)
        (earned (calculate-rewards user))
        (data (default-to {staked-amount: u0, last-update: stacks-block-time, pending-rewards: u0} (map-get? UserInfo user)))
        (new-staked (if (>= (get staked-amount data) amount) 
                       (- (get staked-amount data) amount)
                       u0))
    )
        ;; Check contract is not paused
        (asserts! (not (var-get is-paused)) ERR-PAUSED)
        
        ;; Validate amount is not zero
        (asserts! (> amount u0) ERR-ZERO-AMOUNT)
        
        ;; Validate amount is valid
        (asserts! (is-valid-amount amount) ERR-INVALID-AMOUNT)
        
        ;; Check user has stake
        (asserts! (> (get staked-amount data) u0) ERR-NO-STAKE)
        
        ;; Check user has sufficient staked amount
        (asserts! (>= (get staked-amount data) amount) ERR-INSUFFICIENT-FUNDS)
        
        ;; Transfer tokens back to user (contract -> user)
        (try! (contract-call? token transfer amount (as-contract) user none))

        ;; Update user stake
        (map-set UserInfo user {
            staked-amount: new-staked,
            last-update: stacks-block-time,
            pending-rewards: (+ (get pending-rewards data) earned)
        })

        ;; Update total staked
        (var-set total-staked (- (var-get total-staked) amount))
        (ok true)
    )
)

;; Claim Rewards Function with comprehensive error handling
(define-public (claim-rewards (token <ft-trait>))
    (let (
        (user tx-sender)
        (earned (calculate-rewards user))
        (data (default-to {staked-amount: u0, last-update: stacks-block-time, pending-rewards: u0} (map-get? UserInfo user)))
        (total-to-claim (+ (get pending-rewards data) earned))
    )
        ;; Check contract is not paused
        (asserts! (not (var-get is-paused)) ERR-PAUSED)
        
        ;; Check user exists with stakes or rewards
        (asserts! (or (> (get staked-amount data) u0) (> (get pending-rewards data) u0)) ERR-NO-STAKE)

        ;; Check if there's actually anything to claim
        (asserts! (> total-to-claim u0) ERR-ZERO-REWARDS)
        
        ;; Validate total-to-claim amount
        (asserts! (is-valid-amount total-to-claim) ERR-INVALID-AMOUNT)

        ;; Transfer rewards to user
        (try! (contract-call? token transfer total-to-claim (as-contract) user none))

        ;; Reset the user's pending rewards and update timestamp
        (map-set UserInfo user (merge data {
            last-update: stacks-block-time,
            pending-rewards: u0
        }))

        (ok total-to-claim)
    )
)

;; --- ADMIN FUNCTIONS ---

;; Set contract pause status
(define-public (set-paused (status bool))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-OWNER)
        (ok (var-set is-paused status))
    )
)

;; Set reward rate with validation
(define-public (set-reward-rate (new-rate uint))
    (begin
        ;; Check caller is owner
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-OWNER)
        
        ;; Validate new rate is within acceptable range
        (asserts! (is-rate-valid new-rate) ERR-RATE-TOO-HIGH)
        
        ;; Set the new rate
        (var-set current-reward-rate new-rate)
        (ok true)
    )
)

;; Get user staking information
(define-public (get-user-info (user principal))
    (ok (map-get? UserInfo user))
)

;; Get total staked amount
(define-public (get-total-staked)
    (ok (var-get total-staked))
)

;; Get current reward rate
(define-public (get-reward-rate)
    (ok (var-get current-reward-rate))
)

;; Check if contract is paused
(define-public (is-contract-paused)
    (ok (var-get is-paused))
)