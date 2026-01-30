// Network Detection and Validation Utilities
// Helper functions for working with network configuration at runtime

import { NetworkType, isValidNetwork, getNetworkConfig } from './networks';

/**
 * Detects the current network from environment or URL
 * @returns Detected NetworkType
 * 
 * @example
 * const network = detectNetwork();
 * console.log(network); // 'mainnet'
 */
export function detectNetwork(): NetworkType {
  // First, check environment variable
  const envNetwork = process.env.NEXT_PUBLIC_STACKS_NETWORK;
  if (envNetwork && isValidNetwork(envNetwork)) {
    return envNetwork;
  }

  // Try to detect from hostname if running locally
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Default to devnet on localhost
      return 'devnet';
    }
  }

  // Default to mainnet
  return 'mainnet';
}

/**
 * Result of network validation
 */
export interface NetworkValidationResult {
  isValid: boolean;
  network?: NetworkType;
  error?: string;
}

/**
 * Validates a network value and returns detailed result
 * @param network - Network value to validate
 * @returns ValidationResult with details
 * 
 * @example
 * const result = validateNetwork('testnet');
 * if (result.isValid) {
 *   console.log(result.network); // 'testnet'
 * }
 */
export function validateNetwork(network: unknown): NetworkValidationResult {
  if (typeof network !== 'string') {
    return {
      isValid: false,
      error: `Expected string, got ${typeof network}`,
    };
  }

  const normalized = network.toLowerCase().trim();

  if (!isValidNetwork(normalized)) {
    return {
      isValid: false,
      error: `Invalid network: ${network}. Supported: mainnet, testnet, devnet`,
    };
  }

  return {
    isValid: true,
    network: normalized,
  };
}

/**
 * Network configuration validation with warnings
 */
export interface NetworkConfigValidation {
  isValid: boolean;
  network: NetworkType;
  warnings: string[];
  errors: string[];
}

/**
 * Comprehensively validates network configuration
 * @param network - Network to validate
 * @returns Validation result with warnings and errors
 * 
 * @example
 * const validation = validateNetworkConfig('devnet');
 * if (validation.isValid) {
 *   console.log('Network is valid');
 *   if (validation.warnings.length > 0) {
 *     console.warn(validation.warnings);
 *   }
 * }
 */
export function validateNetworkConfig(network: NetworkType): NetworkConfigValidation {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!isValidNetwork(network)) {
    errors.push(`Unknown network: ${network}`);
    return {
      isValid: false,
      network: 'mainnet',
      warnings,
      errors,
    };
  }

  const config = getNetworkConfig(network);

  // Check for development warning
  if (!config.isProduction) {
    warnings.push(
      `Using ${config.displayName} - this is not a production network. ` +
      `Do NOT use real funds or sensitive data.`
    );
  }

  // Check for devnet specific warnings
  if (network === 'devnet') {
    warnings.push(
      'Devnet is a local development network. ' +
      'Ensure the Clarity DevNet is running locally.'
    );
    warnings.push(
      `Devnet RPC expected at: ${config.rpcUrl}`
    );
  }

  return {
    isValid: true,
    network,
    warnings,
    errors,
  };
}

/**
 * Network compatibility check
 */
export interface NetworkCompatibility {
  isCompatible: boolean;
  requiresTestnet: boolean;
  requiresProduction: boolean;
  recommendedNetworks: NetworkType[];
  message: string;
}

/**
 * Checks if a network is compatible with specific requirements
 * @param network - Network to check
 * @param requiresProduction - If true, requires production network
 * @param requiresTestnet - If true, requires testnet
 * @returns Compatibility result
 * 
 * @example
 * const compat = checkNetworkCompatibility('devnet', true, false);
 * if (!compat.isCompatible) {
 *   console.error(compat.message);
 * }
 */
export function checkNetworkCompatibility(
  network: NetworkType,
  requiresProduction: boolean = false,
  requiresTestnet: boolean = false
): NetworkCompatibility {
  const config = getNetworkConfig(network);
  const isCompatible =
    (!requiresProduction || config.isProduction) &&
    (!requiresTestnet || config.isTestnet);

  const recommendedNetworks: NetworkType[] = [];
  if (requiresProduction) {
    recommendedNetworks.push('mainnet');
  } else if (requiresTestnet) {
    recommendedNetworks.push('testnet', 'devnet');
  } else {
    recommendedNetworks.push('mainnet', 'testnet', 'devnet');
  }

  let message = '';
  if (!isCompatible) {
    if (requiresProduction && !config.isProduction) {
      message = `${config.displayName} is not a production network. ` +
        `Please use Mainnet for production operations.`;
    } else if (requiresTestnet && !config.isTestnet) {
      message = `${config.displayName} is not a testnet. ` +
        `Please use Testnet or Devnet for testing.`;
    }
  }

  return {
    isCompatible,
    requiresProduction,
    requiresTestnet,
    recommendedNetworks,
    message,
  };
}

/**
 * Logs network information to console (useful for debugging)
 * @param network - Network to log
 * 
 * @example
 * logNetworkInfo('testnet');
 * // Logs network configuration details
 */
export function logNetworkInfo(network: NetworkType): void {
  const config = getNetworkConfig(network);
  const validation = validateNetworkConfig(network);

  console.group(`🌐 Network Configuration: ${config.displayName}`);
  console.log(`Network Type: ${config.name}`);
  console.log(`Display Name: ${config.displayName}`);
  console.log(`RPC URL: ${config.rpcUrl}`);
  console.log(`Is Production: ${config.isProduction}`);
  console.log(`Is Testnet: ${config.isTestnet}`);

  if (validation.warnings.length > 0) {
    console.warn('⚠️ Warnings:');
    validation.warnings.forEach(w => console.warn(`  - ${w}`));
  }

  if (validation.errors.length > 0) {
    console.error('❌ Errors:');
    validation.errors.forEach(e => console.error(`  - ${e}`));
  }

  console.groupEnd();
}

export default {
  detectNetwork,
  validateNetwork,
  validateNetworkConfig,
  checkNetworkCompatibility,
  logNetworkInfo,
};
