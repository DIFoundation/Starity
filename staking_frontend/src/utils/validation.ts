// Input Validation Utility for Staking Frontend
// Provides centralized validation for stake amounts, addresses, and contract parameters

// Validation Result Type
export interface ValidationResult<T = void> {
  isValid: boolean;
  error?: string;
  data?: T;
}

// Validation Error Messages
export const ValidationMessages = {
  AMOUNT_REQUIRED: 'Amount is required',
  AMOUNT_INVALID: 'Amount must be a valid number',
  AMOUNT_NEGATIVE: 'Amount must be positive',
  AMOUNT_ZERO: 'Amount must be greater than zero',
  AMOUNT_TOO_LARGE: 'Amount exceeds maximum allowed',
  AMOUNT_INSUFFICIENT_PRECISION: 'Amount has too many decimal places (max 6)',
  AMOUNT_INSUFFICIENT_BALANCE: 'Insufficient balance for this amount',
  ADDRESS_REQUIRED: 'Address is required',
  ADDRESS_INVALID: 'Invalid Stacks address format',
  ADDRESS_INVALID_PRINCIPAL: 'Invalid principal format (expected SP... or SN...)',
  CONTRACT_ADDRESS_INVALID: 'Invalid contract address format',
  TOKEN_ADDRESS_REQUIRED: 'Token contract address is required',
  TOKEN_ADDRESS_INVALID: 'Invalid token contract address',
  NETWORK_INVALID: 'Invalid network specified',
  GENERAL_ERROR: 'Validation failed',
} as const;

// Constants
const STACKS_PRINCIPAL_REGEX = /^(SP|SN)[A-Z0-9]{39,41}$/;
const CONTRACT_IDENTIFIER_REGEX = /^(SP|SN)[A-Z0-9]{39,41}\.[a-z0-9\-]+$/i;
const MAX_SAFE_AMOUNT = Math.pow(2, 128) - 1; // u128 max
const MIN_AMOUNT = 0;
const DECIMAL_PLACES_MAX = 6;

/**
 * Validates a stake amount
 * @param amount - The amount to stake (as string or number)
 * @param maxAmount - Maximum allowed amount (optional)
 * @param userBalance - User's current balance (optional)
 * @returns ValidationResult with amount converted to safe integer
 * 
 * @example
 * // Basic validation
 * const result = validateStakeAmount('100.5');
 * if (result.isValid) {
 *   const validAmount = result.data; // 100.5
 * }
 * 
 * @example
 * // With balance check
 * const result = validateStakeAmount('100.5', undefined, userBalance);
 * if (!result.isValid) {
 *   showError(result.error); // "Insufficient balance for this amount"
 * }
 */
export function validateStakeAmount(
  amount: string | number,
  maxAmount?: number,
  userBalance?: number
): ValidationResult<number> {
  // Check if amount is provided
  if (amount === null || amount === undefined || amount === '') {
    return { isValid: false, error: ValidationMessages.AMOUNT_REQUIRED };
  }

  // Convert to number
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Check if it's a valid number
  if (isNaN(numAmount)) {
    return { isValid: false, error: ValidationMessages.AMOUNT_INVALID };
  }

  // Check if negative
  if (numAmount < MIN_AMOUNT) {
    return { isValid: false, error: ValidationMessages.AMOUNT_NEGATIVE };
  }

  // Check if zero
  if (numAmount === 0) {
    return { isValid: false, error: ValidationMessages.AMOUNT_ZERO };
  }

  // Check decimal places
  const decimalPlaces = (amount.toString().split('.')[1] || '').length;
  if (decimalPlaces > DECIMAL_PLACES_MAX) {
    return { isValid: false, error: ValidationMessages.AMOUNT_INSUFFICIENT_PRECISION };
  }

  // Check if exceeds max safe amount
  if (numAmount > MAX_SAFE_AMOUNT) {
    return { isValid: false, error: ValidationMessages.AMOUNT_TOO_LARGE };
  }

  // Check against max amount if provided
  if (maxAmount !== undefined && numAmount > maxAmount) {
    return { isValid: false, error: ValidationMessages.AMOUNT_TOO_LARGE };
  }

  // Check against user balance if provided
  if (userBalance !== undefined && numAmount > userBalance) {
    return { isValid: false, error: ValidationMessages.AMOUNT_INSUFFICIENT_BALANCE };
  }

  return { isValid: true, data: numAmount };
}

/**
 * Validates an unstake amount (more strict than stake validation)
 * @param amount - The amount to unstake
 * @param stakedAmount - User's current staked amount
 * @returns ValidationResult
 * 
 * @example
 * // Validate unstake with staked amount check
 * const result = validateUnstakeAmount('50', userInfo.stakedAmount);
 * if (result.isValid) {
 *   const validAmount = result.data; // 50
 *   // Safe to unstake
 * } else {
 *   console.log(result.error); // "Insufficient balance for this amount"
 * }
 */
export function validateUnstakeAmount(
  amount: string | number,
  stakedAmount: number
): ValidationResult<number> {
  // First validate basic amount
  const basicValidation = validateStakeAmount(amount);
  if (!basicValidation.isValid) {
    return basicValidation;
  }

  // Check against staked amount
  if ((basicValidation.data ?? 0) > stakedAmount) {
    return { isValid: false, error: ValidationMessages.AMOUNT_INSUFFICIENT_BALANCE };
  }

  return basicValidation;
}

/**
 * Validates a Stacks principal address (SP... or SN...)
 * @param address - The address to validate
 * @returns ValidationResult
 */
export function validateStacksAddress(address: string): ValidationResult {
  if (!address || typeof address !== 'string') {
    return { isValid: false, error: ValidationMessages.ADDRESS_REQUIRED };
  }

  const trimmed = address.trim();

  if (!STACKS_PRINCIPAL_REGEX.test(trimmed)) {
    return { isValid: false, error: ValidationMessages.ADDRESS_INVALID_PRINCIPAL };
  }

  return { isValid: true };
}

/**
 * Validates a contract identifier (SP...contract-name format)
 * @param identifier - The contract identifier
 * @returns ValidationResult
 */
export function validateContractIdentifier(identifier: string): ValidationResult {
  if (!identifier || typeof identifier !== 'string') {
    return { isValid: false, error: ValidationMessages.CONTRACT_ADDRESS_INVALID };
  }

  const trimmed = identifier.trim();

  if (!CONTRACT_IDENTIFIER_REGEX.test(trimmed)) {
    return { isValid: false, error: ValidationMessages.CONTRACT_ADDRESS_INVALID };
  }

  return { isValid: true };
}

/**
 * Validates that a token contract address is provided and valid
 * @param tokenAddress - The token contract address
 * @returns ValidationResult
 */
export function validateTokenAddress(tokenAddress: string | undefined): ValidationResult {
  if (!tokenAddress) {
    return { isValid: false, error: ValidationMessages.TOKEN_ADDRESS_REQUIRED };
  }

  if (typeof tokenAddress !== 'string') {
    return { isValid: false, error: ValidationMessages.TOKEN_ADDRESS_INVALID };
  }

  return validateContractIdentifier(tokenAddress);
}

/**
 * Validates staking operation parameters
 * @param amount - Amount to stake
 * @param tokenAddress - Token contract address
 * @param userBalance - User's available balance
 * @returns ValidationResult
 * 
 * @example
 * // Validate all staking parameters at once
 * const result = validateStakingParams(stakeAmount, tokenAddress, userBalance);
 * if (result.isValid) {
 *   // All parameters are valid, safe to proceed
 *   const txOptions = prepareTransaction(FUNCTIONS.STAKE, {
 *     amount: stakeAmount,
 *     token: tokenAddress,
 *   });
 * } else {
 *   // Show user-friendly error message
 *   setError(result.error);
 * }
 */
export function validateStakingParams(
  amount: string | number,
  tokenAddress: string | undefined,
  userBalance: number = 0
): ValidationResult {
  // Validate amount
  const amountValidation = validateStakeAmount(amount, undefined, userBalance);
  if (!amountValidation.isValid) {
    return amountValidation;
  }

  // Validate token address
  const tokenValidation = validateTokenAddress(tokenAddress);
  if (!tokenValidation.isValid) {
    return tokenValidation;
  }

  return { isValid: true };
}

/**
 * Validates unstaking operation parameters
 * @param amount - Amount to unstake
 * @param tokenAddress - Token contract address
 * @param stakedAmount - User's current staked amount
 * @returns ValidationResult
 */
export function validateUnstakingParams(
  amount: string | number,
  tokenAddress: string | undefined,
  stakedAmount: number
): ValidationResult {
  // Validate amount
  const amountValidation = validateUnstakeAmount(amount, stakedAmount);
  if (!amountValidation.isValid) {
    return amountValidation;
  }

  // Validate token address
  const tokenValidation = validateTokenAddress(tokenAddress);
  if (!tokenValidation.isValid) {
    return tokenValidation;
  }

  return { isValid: true };
}

/**
 * Validates claim rewards parameters
 * @param tokenAddress - Token contract address
 * @param pendingRewards - User's pending rewards
 * @returns ValidationResult
 */
export function validateClaimRewardsParams(
  tokenAddress: string | undefined,
  pendingRewards: number
): ValidationResult {
  // Check if rewards exist
  if (pendingRewards <= 0) {
    return { isValid: false, error: 'No pending rewards to claim' };
  }

  // Validate token address
  const tokenValidation = validateTokenAddress(tokenAddress);
  if (!tokenValidation.isValid) {
    return tokenValidation;
  }

  return { isValid: true };
}

/**
 * Sanitizes user input to prevent injection attacks
 * @param input - User input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  return input.trim().replace(/[<>"']/g, '');
}

/**
 * Converts amount to smallest unit (microSTX or similar)
 * Assumes 6 decimal places (1 token = 1,000,000 smallest units)
 * @param amount - Amount in tokens
 * @returns Amount in smallest units as string (for Clarity uint128)
 * 
 * @example
 * // Convert tokens to microSTX for blockchain submission
 * const tokens = 100.5;
 * const microStx = convertToSmallestUnit(tokens);
 * // Returns: '100500000'
 * 
 * @example
 * // Use in transaction submission
 * const validAmount = validateStakeAmount('100.5').data;
 * const blockchainAmount = convertToSmallestUnit(validAmount);
 * // blockchainAmount can now be used in uintCV() for Clarity
 */
export function convertToSmallestUnit(amount: number): string {
  const factor = 1_000_000; // 6 decimal places
  const smallestUnit = Math.floor(amount * factor);
  return smallestUnit.toString();
}

/**
 * Converts smallest unit back to tokens
 * @param smallestUnit - Amount in smallest units
 * @returns Amount in tokens as number
 * 
 * @example
 * // Convert blockchain value to display format
 * const microStx = '100500000';
 * const tokens = convertFromSmallestUnit(microStx);
 * // Returns: 100.5
 * 
 * @example
 * // Display user's staked amount
 * const stakedAmount = convertFromSmallestUnit(userContractData.staked);
 * displayText(`Staked: ${stakedAmount} STX`);
 */
export function convertFromSmallestUnit(smallestUnit: number | string): number {
  const factor = 1_000_000;
  const amount = typeof smallestUnit === 'string' ? parseInt(smallestUnit, 10) : smallestUnit;
  return amount / factor;
}

export default {
  ValidationMessages,
  validateStakeAmount,
  validateUnstakeAmount,
  validateStacksAddress,
  validateContractIdentifier,
  validateTokenAddress,
  validateStakingParams,
  validateUnstakingParams,
  validateClaimRewardsParams,
  sanitizeInput,
  convertToSmallestUnit,
  convertFromSmallestUnit,
};
