;; Staking Token (BTS) - Comprehensive Error Handling SIP-010
(impl-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

(define-fungible-token staking-token)

;; --- Constants & Variables ---
(define-constant CONTRACT-OWNER tx-sender)
(define-constant MAX-UINT u340282366920938463463374607431768211455) ;; 2^128 - 1
(define-constant MAX-TOKEN-SUPPLY u1000000000000000000000000000) ;; 1 billion tokens with 18 decimals

;; --- COMPREHENSIVE ERROR CODES ---
;; Authorization Errors (100-109)
(define-constant ERR-OWNER-ONLY (err u100))
(define-constant ERR-NOT-TOKEN-OWNER (err u101))
(define-constant ERR-NOT-AUTHORIZED (err u102))
(define-constant ERR-INVALID-CALLER (err u103))

;; Cooldown & Rate Limit Errors (110-119)
(define-constant ERR-COOLDOWN (err u110))
(define-constant ERR-MINT-COOLDOWN-ACTIVE (err u111))
(define-constant ERR-RATE-LIMITED (err u112))

;; Amount Validation Errors (120-129)
(define-constant ERR-ZERO-AMOUNT (err u120))
(define-constant ERR-INSUFFICIENT-BALANCE (err u121))
(define-constant ERR-AMOUNT-TOO-LARGE (err u122))
(define-constant ERR-INVALID-AMOUNT (err u123))

;; Overflow & Math Errors (130-139)
(define-constant ERR-OVERFLOW (err u130))
(define-constant ERR-UNDERFLOW (err u131))
(define-constant ERR-SUPPLY-EXCEEDED (err u132))

;; Transfer Errors (140-149)
(define-constant ERR-TRANSFER-FAILED (err u140))
(define-constant ERR-MINT-FAILED (err u141))
(define-constant ERR-BURN-FAILED (err u142))
(define-constant ERR-INVALID-RECIPIENT (err u143))

;; Minting Params (1000 tokens per mint, 18 decimals)
(define-constant MINT-AMOUNT u1000000000000000000000) 
(define-constant MINT-COOLDOWN u86400) 

(define-map LastMintTimestamp principal uint)

;; --- Authorization Check ---
(define-private (is-owner)
    (is-eq tx-sender CONTRACT-OWNER))

(define-data-var authorized-minter principal tx-sender)

;; --- PRIVATE VALIDATION FUNCTIONS ---

;; Check if amount is valid
(define-private (is-valid-amount (amount uint))
    (and
        (> amount u0)
        (<= amount MAX-UINT)
    )
)

;; Check if amount would exceed supply
(define-private (would-exceed-supply (amount uint))
    (> (+ (ft-get-supply staking-token) amount) MAX-TOKEN-SUPPLY)
)

;; Check principal is valid (not null)
(define-private (is-valid-principal (principal principal))
    (not (is-eq principal 'SZ2J6ZY48GV1EZ5V2V5RB9MP9DRQGCDM847VI54W))
)

;; Check if sender can call function
(define-private (is-caller-valid (caller principal))
    (not (is-eq caller 'SZ2J6ZY48GV1EZ5V2V5RB9MP9DRQGCDM847VI54W))
)

;; --- Public Functions ---

;; Minting with cooldown and supply validation
(define-public (mint)
    (let (
        (last-mint (default-to u0 (map-get? LastMintTimestamp tx-sender)))
        (current-time stacks-block-time)
        (new-supply (+ (ft-get-supply staking-token) MINT-AMOUNT))
    )
        ;; Check caller is valid
        (asserts! (is-caller-valid tx-sender) ERR-INVALID-CALLER)
        
        ;; Ensure user waits 24 hours between mints
        (asserts! (>= current-time (+ last-mint MINT-COOLDOWN)) ERR-MINT-COOLDOWN-ACTIVE)
        
        ;; Validate mint would not exceed max supply
        (asserts! (<= new-supply MAX-TOKEN-SUPPLY) ERR-SUPPLY-EXCEEDED)
        
        ;; Mint tokens
        (try! (ft-mint? staking-token MINT-AMOUNT tx-sender))
        (map-set LastMintTimestamp tx-sender current-time)
        (ok true)
    )
)

;; Burn with validation
(define-public (burn (amount uint) (sender principal))
    (begin
        ;; Check caller is owner of tokens
        (asserts! (is-eq tx-sender sender) ERR-NOT-TOKEN-OWNER)
        
        ;; Validate amount
        (asserts! (> amount u0) ERR-ZERO-AMOUNT)
        (asserts! (is-valid-amount amount) ERR-INVALID-AMOUNT)
        
        ;; Check balance
        (asserts! (>= (ft-get-balance staking-token sender) amount) ERR-INSUFFICIENT-BALANCE)
        
        ;; Burn tokens
        (try! (ft-burn? staking-token amount sender))
        (ok true)
    )
)

;; SIP-010 Transfer with comprehensive validation
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
    (begin
        ;; Check caller is owner
        (asserts! (is-eq tx-sender sender) ERR-NOT-TOKEN-OWNER)
        
        ;; Validate amounts
        (asserts! (> amount u0) ERR-ZERO-AMOUNT)
        (asserts! (is-valid-amount amount) ERR-INVALID-AMOUNT)
        
        ;; Validate recipients
        (asserts! (is-valid-principal recipient) ERR-INVALID-RECIPIENT)
        (asserts! (not (is-eq sender recipient)) ERR-INVALID-RECIPIENT)
        
        ;; Check sender balance
        (asserts! (>= (ft-get-balance staking-token sender) amount) ERR-INSUFFICIENT-BALANCE)

        ;; Perform transfer
        (try! (ft-transfer? staking-token amount sender recipient))

        ;; Print memo if provided
        (match memo to-print (print to-print) 0x)
        (ok true)
    )
)

;; Set authorized minter with validation
(define-public (set-minter (new-minter principal))
    (begin
        ;; Check caller is owner
        (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
        
        ;; Validate minter principal
        (asserts! (is-valid-principal new-minter) ERR-INVALID-CALLER)
        
        ;; Set new minter
        (ok (var-set authorized-minter new-minter))
    )
)

;; Restricted mint for protocol with validation
(define-public (mint-for-protocol (amount uint) (recipient principal))
    (begin
        ;; Check caller is authorized minter
        (asserts! (is-eq tx-sender (var-get authorized-minter)) ERR-NOT-AUTHORIZED)
        
        ;; Validate amount
        (asserts! (> amount u0) ERR-ZERO-AMOUNT)
        (asserts! (is-valid-amount amount) ERR-INVALID-AMOUNT)
        
        ;; Validate recipient
        (asserts! (is-valid-principal recipient) ERR-INVALID-RECIPIENT)
        
        ;; Check supply limit
        (asserts! (<= (+ (ft-get-supply staking-token) amount) MAX-TOKEN-SUPPLY) ERR-SUPPLY-EXCEEDED)
        
        ;; Mint tokens
        (try! (ft-mint? staking-token amount recipient))
        (ok true)
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