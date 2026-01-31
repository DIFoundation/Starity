export class ContractServiceError extends Error {
  public code?: string;
  public transient: boolean;

  constructor(message: string, code?: string, transient = false) {
    super(message);
    this.name = 'ContractServiceError';
    this.code = code;
    this.transient = transient;
  }
}
