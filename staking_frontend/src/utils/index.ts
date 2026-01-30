// Utils barrel export for cleaner imports
export {
  // Validation types and constants
  type ValidationResult,
  type ValidatedStakeAmount,
  type ValidatedUnstakeAmount,
  type BlockchainAmount,
  ValidationMessages,

  // Amount validators
  validateStakeAmount,
  validateUnstakeAmount,

  // Address validators
  validateStacksAddress,
  validateContractIdentifier,
  validateTokenAddress,

  // Composite validators
  validateStakingParams,
  validateUnstakingParams,
  validateClaimRewardsParams,

  // Utility functions
  sanitizeInput,
  convertToSmallestUnit,
  convertFromSmallestUnit,
} from './validation';

export {
  // Contract types and constants
  type StakingFunction,
  type StakingFunctionParams,
  STAKING_CONTRACT,
  getContractParts,
} from './contracts';
