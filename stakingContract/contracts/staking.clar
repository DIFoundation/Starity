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
    (time (- block-burn-time last)) ;; Fix 1
  )
    (let (
      (rate-product (* amount (var-get reward-rate)))
      (time-product (* rate-product time))
    )
      (/ time-product (* YEAR BASIS_POINTS))
    )
  )
)

(define-private (update-user (user principal))
  (let (
    (data (default-to {amount: u0, reward-debt: u0, last-update: block-burn-time} ;; Fix 2
                      (map-get? users user)))
    (reward (calculate-reward (get amount data) (get last-update data)))
  )
    (map-set users user {
      amount: (get amount data),
      reward-debt: (+ (get reward-debt data) reward),
      last-update: block-burn-time ;; Fix 3
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
    ;; ... Inside stake function let block
(data (default-to {amount: u0, reward-debt: u0, last-update: block-burn-time} ;; Fix 4
                  (map-get? users tx-sender)))

      (contract-address (as-contract tx-sender)) 
    )
      ;; Now use the variable
      (try! (stx-transfer? amount tx-sender contract-address))

(map-set users tx-sender {
  amount: (+ (get amount data) amount),
  reward-debt: (get reward-debt data),
  last-update: block-burn-time ;; Fix 5
})

      (var-set total-staked (+ (var-get total-staked) amount))
      (ok true)
    )
  )
)

;; --- UNSTAKE ---
;; (define-public (unstake (amount uint))
;;   (begin
;;     (try! (not-paused))

;;     (asserts! (> amount u0) ERR-INVALID-AMOUNT)

;;     (update-user tx-sender)

;;     (let (
;;       (data (unwrap! (map-get? users tx-sender) ERR-NO-STAKE))
;;     )
;;       (asserts! (>= (get amount data) amount) ERR-INSUFFICIENT-FUNDS)

;;       (try! (as-contract (stx-transfer? amount tx-sender tx-sender)))

;;       (map-set users tx-sender {
;;         amount: (- (get amount data) amount),
;;         reward-debt: (get reward-debt data),
;;         last-update: stacks-block-time
;;       })

;;       (var-set total-staked (- (var-get total-staked) amount))
;;       (ok true)
;;     )
;;   )
;; )
(define-public (unstake (amount uint))
  (begin
    (try! (not-paused))
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (update-user tx-sender)

    (let (
      (user tx-sender) ;; Capture the user's principal here!
      (data (unwrap! (map-get? users user) ERR-NO-STAKE))
    )
      (asserts! (>= (get amount data) amount) ERR-INSUFFICIENT-FUNDS)

      ;; Now: From Contract (tx-sender) to User (user)
      (try! (as-contract (stx-transfer? amount tx-sender user)))

      (map-set users user {
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
;; (define-public (claim)
;;   (begin
;;     (try! (not-paused))

;;     (update-user tx-sender)

;;     (let (
;;       (data (unwrap! (map-get? users tx-sender) ERR-NO-STAKE))
;;       (reward (get reward-debt data))
;;     )
;;       (asserts! (> reward u0) ERR-NO-REWARDS)
;;       (asserts! (>= (var-get reward-pool) reward) ERR-INSUFFICIENT-FUNDS)

;;       (try! (as-contract (stx-transfer? reward tx-sender tx-sender)))

;;       (map-set users tx-sender {
;;         amount: (get amount data),
;;         reward-debt: u0,
;;         last-update: stacks-block-time
;;       })

;;       (var-set reward-pool (- (var-get reward-pool) reward))
;;       (ok reward)
;;     )
;;   )
;; )
(define-public (claim)
  (begin
    (try! (not-paused))
    (update-user tx-sender)
    (let (
      (user tx-sender) ;; Capture user
      (data (unwrap! (map-get? users user) ERR-NO-STAKE))
      (reward (get reward-debt data))
    )
      (asserts! (> reward u0) ERR-NO-REWARDS)
      (asserts! (>= (var-get reward-pool) reward) ERR-INSUFFICIENT-FUNDS)

      ;; Transfer from Contract to User
      (try! (as-contract (stx-transfer? reward tx-sender user)))

      (map-set users user {
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
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
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