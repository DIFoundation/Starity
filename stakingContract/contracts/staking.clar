;; ================================
;; PRODUCTION STAKING CONTRACT
;; ================================

;; --- CONSTANTS ---
(define-constant ERR-NOT-OWNER (err u100))
(define-constant ERR-PAUSED (err u101))
(define-constant ERR-INVALID-AMOUNT (err u102))
(define-constant ERR-NO-STAKE (err u103))
(define-constant ERR-INSUFFICIENT-FUNDS (err u104))
(define-constant ERR-NO-REWARDS (err u105))
(define-constant ERR-TRANSFER-FAILED (err u106))

(define-constant YEAR u31536000) ;; seconds
(define-constant BASIS_POINTS u10000)

;; --- DATA VARS ---
(define-data-var owner principal tx-sender)
(define-data-var paused bool false)
(define-data-var total-staked uint u0)
(define-data-var reward-rate uint u2000) ;; 20% APR
(define-data-var reward-pool uint u0)

;; --- USER MAP ---
(define-map users principal {
  amount: uint,
  reward-debt: uint,
  last-update: uint
})

;; ================================
;; PRIVATE FUNCTIONS
;; ================================

(define-private (only-owner)
  (begin
    (asserts! (is-eq tx-sender (var-get owner)) ERR-NOT-OWNER)
    (ok true)
  )
)

(define-private (not-paused)
  (begin
    (asserts! (not (var-get paused)) ERR-PAUSED)
    (ok true)
  )
)

(define-private (calculate-reward (amount uint) (last uint))
  (let (
    (time (- stacks-block-time last))
    (rate-product (* amount (var-get reward-rate)))
    (time-product (* rate-product time))
  )
    (/ time-product (* YEAR BASIS_POINTS))
  )
)

(define-private (update-user (user principal))
  (let (
    (data (default-to {amount: u0, reward-debt: u0, last-update: stacks-block-time}
                      (map-get? users user)))
    (reward (calculate-reward (get amount data) (get last-update data)))
  )
    (map-set users user {
      amount: (get amount data),
      reward-debt: (+ (get reward-debt data) reward),
      last-update: stacks-block-time
    })
  )
)

;; ================================
;; PUBLIC FUNCTIONS
;; ================================

;; --- STAKE ---
(define-public (stake (amount uint))
  (begin
    (try! (not-paused))

    (asserts! (> amount u0) ERR-INVALID-AMOUNT)

    (update-user tx-sender)

    (let (
      (data (unwrap! (map-get? users tx-sender) ERR-NO-STAKE))
    )
      (try! (stx-transfer? amount tx-sender current-contract))

      (map-set users tx-sender {
        amount: (+ (get amount data) amount),
        reward-debt: (get reward-debt data),
        last-update: stacks-block-time
      })

      (var-set total-staked (+ (var-get total-staked) amount))
      (ok true)
    )
  )
)

;; --- UNSTAKE ---
(define-public (unstake (amount uint))
  (begin
    (try! (not-paused))

    (asserts! (> amount u0) ERR-INVALID-AMOUNT)

    (update-user tx-sender)

    (let (
      (data (unwrap! (map-get? users tx-sender) ERR-NO-STAKE))
    )
      (asserts! (>= (get amount data) amount) ERR-INSUFFICIENT-FUNDS)

      (try! (stx-transfer? amount current-contract tx-sender))

      (map-set users tx-sender {
        amount: (- (get amount data) amount),
        reward-debt: (get reward-debt data),
        last-update: stacks-block-time
      })

      (var-set total-staked (- (var-get total-staked) amount))
      (ok true)
    )
  )
)

;; --- CLAIM REWARDS ---
(define-public (claim)
  (begin
    (try! (not-paused))

    (update-user tx-sender)

    (let (
      (data (unwrap! (map-get? users tx-sender) ERR-NO-STAKE))
      (reward (get reward-debt data))
    )
      (asserts! (> reward u0) ERR-NO-REWARDS)
      (asserts! (>= (var-get reward-pool) reward) ERR-INSUFFICIENT-FUNDS)

      (try! (stx-transfer? reward current-contract tx-sender))

      (map-set users tx-sender {
        amount: (get amount data),
        reward-debt: u0,
        last-update: stacks-block-time
      })

      (var-set reward-pool (- (var-get reward-pool) reward))
      (ok reward)
    )
  )
)

;; ================================
;; ADMIN FUNCTIONS
;; ================================

;; fund reward pool
(define-public (fund (amount uint))
  (begin
    (try! (only-owner))
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (try! (stx-transfer? amount tx-sender current-contract))
    (var-set reward-pool (+ (var-get reward-pool) amount))
    (ok true)
  )
)

;; set APR
(define-public (set-rate (rate uint))
  (begin
    (try! (only-owner))
    (asserts! (<= rate u10000) ERR-INVALID-AMOUNT)
    (var-set reward-rate rate)
    (ok true)
  )
)

;; pause/unpause
(define-public (set-paused (state bool))
  (begin
    (try! (only-owner))
    (var-set paused state)
    (ok true)
  )
)

;; ================================
;; READ FUNCTIONS
;; ================================

(define-read-only (get-user (user principal))
  (map-get? users user)
)

(define-read-only (get-total-staked)
  (var-get total-staked)
)

(define-read-only (get-reward-pool)
  (var-get reward-pool)
)