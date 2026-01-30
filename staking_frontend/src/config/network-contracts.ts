// Network-Aware Contract Configuration
// Maps contract addresses to different networks

import { NetworkType } from './networks';

/**
 * Contract address mapping per network
 */
export interface NetworkContractAddresses {
  mainnet: string;
  testnet: string;
  devnet: string;
}

/**
 * Gets the contract address for a specific network
 * @param network - Target network
 * @param addresses - Address mapping for all networks
 * @param defaultAddress - Fallback address if not configured
 * @returns Contract address for the network
 * 
 * @example
 * const stakingAddress = getNetworkContractAddress(
 *   'testnet',
 *   {
 *     mainnet: 'SP...',
 *     testnet: 'SN...',
 *     devnet: 'SN...',
 *   }
 * );
 */
export function getNetworkContractAddress(
  network: NetworkType,
  addresses: NetworkContractAddresses,
  defaultAddress?: string
): string {
  return addresses[network] || defaultAddress || '';
}

/**
 * Validates that contract addresses are configured for all networks
 * @param addresses - Address mapping to validate
 * @returns Validation result with missing networks
 * 
 * @example
 * const validation = validateNetworkAddresses({
 *   mainnet: 'SP...',
 *   testnet: '',
 *   devnet: 'SN...',
 * });
 * if (!validation.isValid) {
 *   console.warn('Missing addresses for:', validation.missingNetworks);
 * }
 */
export interface AddressValidationResult {
  isValid: boolean;
  missingNetworks: NetworkType[];
  warnings: string[];
}

export function validateNetworkAddresses(
  addresses: Partial<NetworkContractAddresses>
): AddressValidationResult {
  const missingNetworks: NetworkType[] = [];
  const warnings: string[] = [];

  const networks: NetworkType[] = ['mainnet', 'testnet', 'devnet'];
  
  networks.forEach(network => {
    if (!addresses[network]) {
      missingNetworks.push(network);
      warnings.push(`Missing contract address for ${network}`);
    }
  });

  return {
    isValid: missingNetworks.length === 0,
    missingNetworks,
    warnings,
  };
}

/**
 * Helper to create network-aware contract configuration
 * @param mainnetAddress - Mainnet contract address
 * @param testnetAddress - Testnet contract address
 * @param devnetAddress - Devnet contract address (optional, can be same as testnet)
 * @returns NetworkContractAddresses mapping
 * 
 * @example
 * const addresses = createNetworkAddresses(
 *   'SP2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.staking',
 *   'SN2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.staking-test',
 *   'SN2JXKMH4R3YJJ5MKBAXJ5DZX3N6Q6S59GVHWFVS7.staking-dev'
 * );
 */
export function createNetworkAddresses(
  mainnetAddress: string,
  testnetAddress: string,
  devnetAddress?: string
): NetworkContractAddresses {
  return {
    mainnet: mainnetAddress,
    testnet: testnetAddress,
    devnet: devnetAddress || testnetAddress, // Default to testnet if devnet not provided
  };
}

/**
 * Logs network-specific contract configuration
 * @param contractName - Name of the contract (for logging)
 * @param addresses - Address mapping
 * 
 * @example
 * logNetworkAddresses('StakingContract', addresses);
 */
export function logNetworkAddresses(
  contractName: string,
  addresses: NetworkContractAddresses
): void {
  console.group(`📋 ${contractName} - Network Addresses`);
  console.log('Mainnet:', addresses.mainnet);
  console.log('Testnet:', addresses.testnet);
  console.log('Devnet:', addresses.devnet);
  console.groupEnd();
}

export default {
  getNetworkContractAddress,
  validateNetworkAddresses,
  createNetworkAddresses,
  logNetworkAddresses,
};
