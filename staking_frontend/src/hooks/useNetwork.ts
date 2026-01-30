// useNetwork Hook
// Provides network selection and management capabilities to React components

import { useState, useCallback, useEffect } from 'react';
import { NetworkType, isValidNetwork, getNetworkConfig, getNetworkOptions } from '@/config/networks';
import { logNetworkInfo } from '@/config/network-utils';
import FRONTEND_ENV from '@/config/env';

/**
 * Hook for managing network selection in components
 * @returns Network state and control functions
 * 
 * @example
 * function NetworkSwitcher() {
 *   const { currentNetwork, isAvailable, changeNetwork, networks } = useNetwork();
 *   
 *   return (
 *     <div>
 *       <p>Current: {currentNetwork}</p>
 *       <select onChange={(e) => changeNetwork(e.target.value as NetworkType)}>
 *         {networks.map(net => (
 *           <option key={net.name} value={net.name}>
 *             {net.displayName}
 *           </option>
 *         ))}
 *       </select>
 *     </div>
 *   );
 * }
 */
export function useNetwork() {
  const [currentNetwork, setCurrentNetwork] = useState<NetworkType>(FRONTEND_ENV.STACKS_NETWORK);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current network config
  const networkConfig = getNetworkConfig(currentNetwork);
  
  // Get all available networks
  const networks = getNetworkOptions();

  // Check if a network is available (could be extended for actual availability checks)
  const isAvailable = useCallback((network: NetworkType): boolean => {
    // Devnet requires localhost
    if (network === 'devnet' && typeof window !== 'undefined') {
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';
      return isLocalhost;
    }
    return true;
  }, []);

  // Change network with validation
  const changeNetwork = useCallback(async (network: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      // Validate network
      if (!isValidNetwork(network)) {
        throw new Error(`Invalid network: ${network}`);
      }

      // Check availability
      if (!isAvailable(network)) {
        throw new Error(
          `${getNetworkConfig(network).displayName} is not available in this environment. ` +
          `Devnet requires localhost.`
        );
      }

      // Update network
      setCurrentNetwork(network);
      
      // Log network info for debugging
      logNetworkInfo(network);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Network change error:', errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable]);

  // Get network description
  const getDescription = useCallback((): string => {
    return `${networkConfig.displayName} (${networkConfig.rpcUrl})`;
  }, [networkConfig]);

  // Check if current network is production
  const isProduction = networkConfig.isProduction;

  // Check if current network is testnet
  const isTestnet = networkConfig.isTestnet;

  return {
    // Current network info
    currentNetwork,
    networkConfig,
    networkDescription: getDescription(),
    isProduction,
    isTestnet,

    // Network list
    networks,
    isAvailable,

    // Network operations
    changeNetwork,
    
    // State
    isLoading,
    error,
  };
}

export default useNetwork;
