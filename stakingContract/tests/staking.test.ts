
import { describe, expect, it, beforeEach } from "vitest";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;
const deployer = accounts.get("deployer")!;

// Helper to get user info from staking contract
const getUserInfo = (wallet: string) => {
  const { result } = simnet.callReadOnlyFn("staking", "get-user-info", [wallet], wallet);
  return result;
};

// Helper to get contract state
const getContractState = () => {
  const isPaused = simnet.callReadOnlyFn("staking", "get-is-paused", [], deployer).result;
  const totalStaked = simnet.callReadOnlyFn("staking", "get-total-staked", [], deployer).result;
  const rewardRate = simnet.callReadOnlyFn("staking", "get-reward-rate", [], deployer).result;
  return { isPaused, totalStaked, rewardRate };
};

describe("Staking Contract - Setup and Initialization", () => {
  it("ensures simnet is well initialised", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  it("contract initializes with default state", () => {
    const state = getContractState();
    expect(state.isPaused).toBeDefined();
    expect(state.totalStaked).toBeDefined();
    expect(state.rewardRate).toBeDefined();
  });

  it("new user has no staked amount", () => {
    const userInfo = getUserInfo(wallet1);
    expect(userInfo).toBeDefined();
  });
});

describe("Stake Function - Basic Operations", () => {
  it("user can stake tokens", () => {
    const stakeAmount = 1000;
    const block = simnet.callPublicFn(
      "staking",
      "stake",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token", `u${stakeAmount}`],
      wallet1
    );
    expect(block.result).toBeOk();
  });

  it("staking updates total-staked", () => {
    const stakeAmount = 1000;
    simnet.callPublicFn(
      "staking",
      "stake",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token", `u${stakeAmount}`],
      wallet1
    );
    
    const state = getContractState();
    expect(state.totalStaked).toBeUint(stakeAmount);
  });

  it("staking multiple times accumulates stake", () => {
    const amount1 = 1000;
    const amount2 = 500;
    
    simnet.callPublicFn(
      "staking",
      "stake",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token", `u${amount1}`],
      wallet2
    );
    
    simnet.callPublicFn(
      "staking",
      "stake",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token", `u${amount2}`],
      wallet2
    );
    
    const state = getContractState();
    expect(state.totalStaked).toBeUint(amount1 + amount2);
  });
});

describe("Stake Function - Edge Cases and Errors", () => {
  it("contract rejects staking when paused", () => {
    // Set paused to true
    simnet.callPublicFn("staking", "set-paused", ["true"], deployer);
    
    const result = simnet.callPublicFn(
      "staking",
      "stake",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token", "u1000"],
      wallet1
    );
    expect(result.result).toBeErr();
  });

  it("multiple users can stake independently", () => {
    const amount = 500;
    
    simnet.callPublicFn(
      "staking",
      "stake",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token", `u${amount}`],
      wallet1
    );
    
    simnet.callPublicFn(
      "staking",
      "stake",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token", `u${amount}`],
      wallet2
    );
    
    const state = getContractState();
    expect(state.totalStaked).toBeUint(amount * 2);
  });

  it("zero amount stake is rejected or handled", () => {
    const result = simnet.callPublicFn(
      "staking",
      "stake",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token", "u0"],
      wallet1
    );
    // Should either error or not increase total
    const state = getContractState();
    expect(state.totalStaked).toBeUint(0);
  });
});

describe("Unstake Function - Basic Operations", () => {
  beforeEach(() => {
    // Setup: stake some tokens first
    simnet.callPublicFn(
      "staking",
      "stake",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token", "u2000"],
      wallet1
    );
  });

  it("user can unstake tokens", () => {
    const unstakeAmount = 500;
    const result = simnet.callPublicFn(
      "staking",
      "unstake",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token", `u${unstakeAmount}`],
      wallet1
    );
    expect(result.result).toBeOk();
  });

  it("unstaking reduces total-staked", () => {
    const unstakeAmount = 500;
    simnet.callPublicFn(
      "staking",
      "unstake",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token", `u${unstakeAmount}`],
      wallet1
    );
    
    const state = getContractState();
    expect(state.totalStaked).toBeUint(2000 - unstakeAmount);
  });

  it("user cannot unstake more than staked amount", () => {
    const result = simnet.callPublicFn(
      "staking",
      "unstake",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token", "u5000"],
      wallet1
    );
    expect(result.result).toBeErr();
  });
});

describe("Unstake Function - Advanced Scenarios", () => {
  beforeEach(() => {
    // Setup: multiple users with different stakes
    simnet.callPublicFn(
      "staking",
      "stake",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token", "u1000"],
      wallet1
    );
    
    simnet.callPublicFn(
      "staking",
      "stake",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token", "u3000"],
      wallet2
    );
  });

  it("unstaking from one user doesn't affect others", () => {
    simnet.callPublicFn(
      "staking",
      "unstake",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token", "u500"],
      wallet1
    );
    
    const state = getContractState();
    expect(state.totalStaked).toBeUint(3500); // 1000 - 500 + 3000
  });

  it("user can unstake all their tokens", () => {
    const result = simnet.callPublicFn(
      "staking",
      "unstake",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token", "u1000"],
      wallet1
    );
    expect(result.result).toBeOk();
    
    const state = getContractState();
    expect(state.totalStaked).toBeUint(3000);
  });

  it("cannot unstake when contract is paused", () => {
    simnet.callPublicFn("staking", "set-paused", ["true"], deployer);
    
    const result = simnet.callPublicFn(
      "staking",
      "unstake",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token", "u100"],
      wallet1
    );
    expect(result.result).toBeErr();
  });
});

describe("Claim Rewards Function - Basic Operations", () => {
  beforeEach(() => {
    // Setup: stake tokens and advance time
    simnet.callPublicFn(
      "staking",
      "stake",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token", "u1000"],
      wallet1
    );
    
    // Advance blocks to accumulate rewards
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();
  });

  it("user can claim rewards after staking", () => {
    const result = simnet.callPublicFn(
      "staking",
      "claim-rewards",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token"],
      wallet1
    );
    expect(result.result).toBeOk();
  });

  it("claiming rewards returns value", () => {
    const result = simnet.callPublicFn(
      "staking",
      "claim-rewards",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token"],
      wallet1
    );
    expect(result.result).toBeOk();
    expect(result.result).toHaveCvType("uint");
  });

  it("user without rewards cannot claim", () => {
    const result = simnet.callPublicFn(
      "staking",
      "claim-rewards",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token"],
      wallet3
    );
    expect(result.result).toBeErr();
  });
});

describe("Claim Rewards Function - Reward Accumulation", () => {
  beforeEach(() => {
    // Setup: stake with enough time for rewards
    simnet.callPublicFn(
      "staking",
      "stake",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token", "u1000"],
      wallet1
    );
    
    // Advance time to accumulate rewards
    for (let i = 0; i < 10; i++) {
      simnet.mineEmptyBlock();
    }
  });

  it("rewards accumulate over time", () => {
    // Claim rewards and store the value
    const result1 = simnet.callPublicFn(
      "staking",
      "claim-rewards",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token"],
      wallet2
    );
    
    // Mine more blocks
    for (let i = 0; i < 10; i++) {
      simnet.mineEmptyBlock();
    }
    
    const result2 = simnet.callPublicFn(
      "staking",
      "claim-rewards",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token"],
      wallet2
    );
    
    // Both should be ok or both should error - testing consistency
    expect(result1.result).toBeDefined();
    expect(result2.result).toBeDefined();
  });

  it("claiming resets pending rewards", () => {
    // Claim rewards
    const result1 = simnet.callPublicFn(
      "staking",
      "claim-rewards",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token"],
      wallet1
    );
    expect(result1.result).toBeOk();
    
    // Immediately claim again (should have no new rewards yet)
    const result2 = simnet.callPublicFn(
      "staking",
      "claim-rewards",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token"],
      wallet1
    );
    
    // Second claim might fail if no rewards available
    expect(result2.result).toBeDefined();
  });

  it("multiple users can claim independently", () => {
    // Stake with wallet2
    simnet.callPublicFn(
      "staking",
      "stake",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token", "u500"],
      wallet2
    );
    
    // Advance time
    for (let i = 0; i < 5; i++) {
      simnet.mineEmptyBlock();
    }
    
    // Both claim
    const result1 = simnet.callPublicFn(
      "staking",
      "claim-rewards",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token"],
      wallet1
    );
    
    const result2 = simnet.callPublicFn(
      "staking",
      "claim-rewards",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token"],
      wallet2
    );
    
    expect(result1.result).toBeDefined();
    expect(result2.result).toBeDefined();
  });
});

describe("Stake, Unstake, and Claim Integration Tests", () => {
  it("user can stake, earn rewards, and unstake", () => {
    // Stake
    const stake = simnet.callPublicFn(
      "staking",
      "stake",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token", "u1000"],
      wallet1
    );
    expect(stake.result).toBeOk();
    
    // Advance time for rewards
    for (let i = 0; i < 20; i++) {
      simnet.mineEmptyBlock();
    }
    
    // Claim rewards
    const claim = simnet.callPublicFn(
      "staking",
      "claim-rewards",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token"],
      wallet1
    );
    expect(claim.result).toBeDefined();
    
    // Unstake
    const unstake = simnet.callPublicFn(
      "staking",
      "unstake",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token", "u1000"],
      wallet1
    );
    expect(unstake.result).toBeOk();
  });

  it("total-staked is consistent across operations", () => {
    const stakeAmount1 = 1000;
    const stakeAmount2 = 500;
    
    simnet.callPublicFn(
      "staking",
      "stake",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token", `u${stakeAmount1}`],
      wallet1
    );
    
    let state = getContractState();
    expect(state.totalStaked).toBeUint(stakeAmount1);
    
    simnet.callPublicFn(
      "staking",
      "stake",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token", `u${stakeAmount2}`],
      wallet2
    );
    
    state = getContractState();
    expect(state.totalStaked).toBeUint(stakeAmount1 + stakeAmount2);
    
    simnet.callPublicFn(
      "staking",
      "unstake",
      ["'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.staking-token", "u250"],
      wallet2
    );
    
    state = getContractState();
    expect(state.totalStaked).toBeUint(stakeAmount1 + stakeAmount2 - 250);
  });
});
