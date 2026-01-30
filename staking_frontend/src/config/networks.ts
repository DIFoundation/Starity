// Network Configuration for Staking Frontend
// Provides support for multiple Stacks networks: Mainnet, Testnet, and Devnet

import { StacksNetwork, STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';

/**
 * Supported network types for the staking application
 */
export type NetworkType = 'mainnet' | 'testnet' | 'devnet';

/**
 * Network configuration interface
 */
export interface NetworkConfig {
  name: NetworkType;
  displayName: string;
  rpcUrl: string;
  broadcastEndpoint: string;
  transactionVersion: 'mainnet' | 'testnet';
  chainId: number;
  isProduction: boolean;
  isTestnet: boolean;
}

/**
 * Network configurations for all supported networks
 */
export const NETWORKS: Record<NetworkType, NetworkConfig> = {
  mainnet: {
    name: 'mainnet',
    displayName: 'Mainnet',
    rpcUrl: 'https://api.mainnet.hiro.so',
    broadcastEndpoint: 'https://api.mainnet.hiro.so',
    transactionVersion: 'mainnet',
    chainId: 0,
    isProduction: true,
    isTestnet: false,
  },
  testnet: {
    name: 'testnet',
    displayName: 'Testnet',
    rpcUrl: 'https://api.testnet.hiro.so',
    broadcastEndpoint: 'https://api.testnet.hiro.so',
    transactionVersion: 'testnet',
    chainId: 0x80000000,
    isProduction: false,
    isTestnet: true,
  },
  devnet: {
    name: 'devnet',
    displayName: 'Local Devnet',
    rpcUrl: 'http://localhost:3999',
    broadcastEndpoint: 'http://localhost:3999',
    transactionVersion: 'testnet',
    chainId: 0x80000000,
    isProduction: false,
    isTestnet: true,
  },
};

/**
 * Validates if a string is a valid network type
 * @param network - String to validate
 * @returns true if valid network type
 * 
 * @example
 * isValidNetwork('mainnet'); // true
 * isValidNetwork('invalid'); // false
 */
export function isValidNetwork(network: string): network is NetworkType {
  return network === 'mainnet' || network === 'testnet' || network === 'devnet';
}

/**
 * Gets the network configuration for a given network type
 * @param network - Network type
 * @returns NetworkConfig
 * @throws Error if network is invalid
 * 
 * @example
 * const config = getNetworkConfig('testnet');
 * console.log(config.displayName); // "Testnet"
 */
export function getNetworkConfig(network: NetworkType): NetworkConfig {
  return NETWORKS[network];
}

/**
 * Gets the Stacks network object for a given network type
 * @param network - Network type
 * @returns StacksNetwork instance
 * 
 * @example
 * const stacksNetwork = getStacksNetwork('testnet');
 * // Use with @stacks/connect or @stacks/transactions
 */
export function getStacksNetwork(network: NetworkType): StacksNetwork {
  switch (network) {
    case 'mainnet':
      return STACKS_MAINNET;
    case 'testnet':
      return STACKS_TESTNET;
    case 'devnet': {
      // Create custom devnet configuration
      // Based on Clarity DevNet setup from stacks-node
      const devnetConfig = new StacksNetwork({
        url: NETWORKS.devnet.rpcUrl,
        chainId: NETWORKS.devnet.chainId as any,
      });
      return devnetConfig;
    }
    default:
      throw new Error(`Unknown network: ${network}`);
  }
}

/**
 * Gets all available network options for UI dropdowns/selectors
 * @returns Array of network options with name and displayName
 * 
 * @example
 * const options = getNetworkOptions();
 * // [
 * //   { name: 'mainnet', displayName: 'Mainnet' },
 * //   { name: 'testnet', displayName: 'Testnet' },
 * //   { name: 'devnet', displayName: 'Local Devnet' }
 * // ]
 */
export function getNetworkOptions(): Array<{ name: NetworkType; displayName: string }> {
  return Object.values(NETWORKS).map(config => ({
    name: config.name,
    displayName: config.displayName,
  }));
}

/**
 * Checks if a network is a production network
 * @param network - Network type
 * @returns true if network is production
 * 
 * @example
 * isProductionNetwork('mainnet'); // true
 * isProductionNetwork('testnet'); // false
 */
export function isProductionNetwork(network: NetworkType): boolean {
  return getNetworkConfig(network).isProduction;
}

/**
 * Checks if a network is a testnet
 * @param network - Network type
 * @returns true if network is a testnet
 * 
 * @example
 * isTestnet('testnet'); // true
 * isTestnet('mainnet'); // false
 */
export function isTestnet(network: NetworkType): boolean {
  return getNetworkConfig(network).isTestnet;
}

/**
 * Gets a descriptive string for the current network
 * @param network - Network type
 * @returns Human-readable network description
 * 
 * @example
 * getNetworkDescription('mainnet');
 * // "Mainnet (Production) - https://api.mainnet.hiro.so"
 */
export function getNetworkDescription(network: NetworkType): string {
  const config = getNetworkConfig(network);
  const env = config.isProduction ? 'Production' : config.isTestnet ? 'Testnet' : 'Local';
  return `${config.displayName} (${env}) - ${config.rpcUrl}`;
}

/**
 * Network selection result type
 */
export interface NetworkSelection {
  network: NetworkType;
  config: NetworkConfig;
  stacksNetwork: StacksNetwork;
  isProduction: boolean;
  displayName: string;
}

/**
 * Selects a network and returns complete network configuration
 * @param network - Network type to select
 * @returns Complete network selection with all relevant data
 * @throws Error if network is invalid
 * 
 * @example
 * const selection = selectNetwork('testnet');
 * console.log(selection.displayName); // "Testnet"
 * console.log(selection.config.rpcUrl); // "https://api.testnet.hiro.so"
 * console.log(selection.stacksNetwork); // StacksNetwork instance
 */
export function selectNetwork(network: NetworkType): NetworkSelection {
  if (!isValidNetwork(network)) {
    throw new Error(`Invalid network: ${network}`);
  }

  const config = getNetworkConfig(network);
  const stacksNetwork = getStacksNetwork(network);

  return {
    network,
    config,
    stacksNetwork,
    isProduction: config.isProduction,
    displayName: config.displayName,
  };
}

/**
 * Default network configuration
 * Falls back to mainnet if not specified
 */
export const DEFAULT_NETWORK: NetworkType = 'mainnet';

export default {
  NETWORKS,
  isValidNetwork,
  getNetworkConfig,
  getStacksNetwork,
  getNetworkOptions,
  isProductionNetwork,
  isTestnet,
  getNetworkDescription,
  selectNetwork,
  DEFAULT_NETWORK,
};
