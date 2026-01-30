// Config barrel export for cleaner imports
export { FRONTEND_ENV, default } from './env';

// Network configuration exports
export {
  type NetworkType,
  type NetworkConfig,
  type NetworkSelection,
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
} from './networks';

// Network utilities exports
export {
  detectNetwork,
  validateNetwork,
  validateNetworkConfig,
  checkNetworkCompatibility,
  logNetworkInfo,
  type NetworkValidationResult,
  type NetworkConfigValidation,
  type NetworkCompatibility,
} from './network-utils';

// Network contract configuration exports
export {
  getNetworkContractAddress,
  validateNetworkAddresses,
  createNetworkAddresses,
  logNetworkAddresses,
  type NetworkContractAddresses,
  type AddressValidationResult,
} from './network-contracts';
