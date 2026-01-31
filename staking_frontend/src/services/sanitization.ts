/**
 * Form Sanitization Utilities
 *
 * Convenient wrappers for sanitizing form inputs before submission
 */

import { sanitizeInput, isAddressSafe, SecurityError } from '@/services/security';

export interface SanitizationResult<T> {
  success: boolean;
  data?: T;
  error?: SecurityError;
}

/**
 * Sanitize and validate a staking form
 */
export interface StakingFormData {
  amount: string;
  userAddress: string;
}

export function sanitizeStakingForm(data: Partial<StakingFormData>): SanitizationResult<StakingFormData> {
  try {
    const amount = sanitizeInput(data.amount || '', 'amount');
    const userAddress = sanitizeInput(data.userAddress || '', 'address');

    return {
      success: true,
      data: { amount, userAddress },
    };
  } catch (error) {
    if (error instanceof SecurityError) {
      return {
        success: false,
        error,
      };
    }
    throw error;
  }
}

/**
 * Validate address without throwing
 */
export function validateAddressSafely(address: string): {
  valid: boolean;
  message?: string;
} {
  if (!address) {
    return {
      valid: false,
      message: 'Address is required',
    };
  }

  if (!isAddressSafe(address)) {
    return {
      valid: false,
      message: 'Invalid Stacks address format',
    };
  }

  return {
    valid: true,
  };
}

/**
 * Validate amount without throwing
 */
export function validateAmountSafely(amount: string | number): {
  valid: boolean;
  message?: string;
} {
  try {
    sanitizeInput(String(amount), 'amount');
    return { valid: true };
  } catch (error) {
    if (error instanceof SecurityError) {
      return {
        valid: false,
        message: error.message,
      };
    }
    throw error;
  }
}

/**
 * Escape HTML for display
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Safely display user-provided addresses
 */
export function displayAddress(address: string): string {
  try {
    const sanitized = sanitizeInput(address, 'address');
    return sanitized;
  } catch {
    return '[Invalid Address]';
  }
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, start: number = 8, end: number = 6): string {
  const safe = displayAddress(address);
  if (safe.length <= start + end) {
    return safe;
  }
  return `${safe.substring(0, start)}...${safe.substring(safe.length - end)}`;
}
