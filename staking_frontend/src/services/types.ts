import { StacksNetwork } from '@stacks/network';
import { ClarityValue } from '@stacks/transactions';

export type ContractIdentifier = string; // 'SP... .contract-name'

export interface ReadOnlyCallOptions {
  network: StacksNetwork;
  contractIdentifier: ContractIdentifier;
  functionName: string;
  functionArgs?: ClarityValue[];
  senderAddress?: string;
}

export interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
}

export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
}
