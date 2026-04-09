import { describe, expect, it, beforeEach } from "vitest";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;
const deployer = accounts.get("deployer")!;

// ======= TEST HELPERS =======
// Helper to get contract state
const getContractState = () => {
  const totalStaked = simnet.callReadOnlyFn("staking", "get-total-staked", [], deployer).result;
  const rewardPool = simnet.callReadOnlyFn("staking", "get-reward-pool", [], deployer).result;
  return { totalStaked, rewardPool };
};

// Helper to get user data
const getUserData = (user: string) => {
  return simnet.callReadOnlyFn("staking", "get-user", [user], deployer).result;
};

// Helper to fund reward pool
const fundRewardPool = (amount: number) => {
  return simnet.callPublicFn("staking", "fund", [`u${amount}`], deployer);
};

// Helper to set paused state
const setPaused = (paused: boolean) => {
  return simnet.callPublicFn("staking", "set-paused", [paused], deployer);
};

// ======= SETUP & INITIALIZATION TESTS =======
describe("Staking Contract - Setup and Initialization", () => {
  it("ensures simnet is well initialised", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  it("contract initializes with default state", () => {
    const state = getContractState();
    expect(state.totalStaked).toBeUint(0);
    expect(state.rewardPool).toBeUint(0);
  });

  it("total-staked starts at zero", () => {
    const state = getContractState();
    expect(state.totalStaked).toBeUint(0);
  });
});

// ======= STAKE - BASIC OPERATIONS =======
describe("Stake Function - Basic Operations", () => {
  it("user can stake tokens", () => {
    const stakeAmount = 1000;
    const block = simnet.callPublicFn(
      "staking",
      "stake",
      [`u${stakeAmount}`],
      wallet1
    );
    expect(block.result).toBeOk(true);
  });

  it("staking updates total-staked", () => {
    const stakeAmount = 1000;
    simnet.callPublicFn(
      "staking",
      "stake",
      [`u${stakeAmount}`],
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
      [`u${amount1}`],
      wallet2
    );
    
    simnet.callPublicFn(
      "staking",
      "stake",
      [`u${amount2}`],
      wallet2
    );
    
    const state = getContractState();
    expect(state.totalStaked).toBeUint(amount1 + amount2);
  });

  it("staking updates user data", () => {
    const stakeAmount = 1000;
    simnet.callPublicFn(
      "staking",
      "stake",
      [`u${stakeAmount}`],
      wallet1
    );
    
    const userData = getUserData(wallet1);
    expect(userData).toBeSome();
    if (userData.type === "some") {
      const data = userData.value as any;
      expect(data.amount).toBeUint(stakeAmount);
      expect(data["reward-debt"]).toBeUint(0);
    }
  });
});

// ======= STAKE - EDGE CASES & ERRORS =======
describe("Stake Function - Edge Cases and Errors", () => {
  it("contract rejects staking when paused", () => {
    // Set paused to true
    setPaused(true);
    
    const result = simnet.callPublicFn(
      "staking",
      "stake",
      ["u1000"],
      wallet1
    );
    expect(result.result).toBeErr(101);
  });

  it("multiple users can stake independently", () => {
    const amount = 500;
    
    simnet.callPublicFn(
      "staking",
      "stake",
      [`u${amount}`],
      wallet1
    );
    
    simnet.callPublicFn(
      "staking",
      "stake",
      [`u${amount}`],
      wallet2
    );
    
    const state = getContractState();
    expect(state.totalStaked).toBeUint(amount * 2);
  });

  it("zero amount stake is rejected", () => {
    const result = simnet.callPublicFn(
      "staking",
      "stake",
      ["u0"],
      wallet1
    );
    expect(result.result).toBeErr(102);
    const state = getContractState();
    expect(state.totalStaked).toBeUint(0);
  });
});

// ======= UNSTAKE - BASIC OPERATIONS =======
describe("Unstake Function - Basic Operations", () => {
  beforeEach(() => {
    // Setup: stake some tokens first
    simnet.callPublicFn(
      "staking",
      "stake",
      ["u2000"],
      wallet1
    );
  });

  it("user can unstake tokens", () => {
    const unstakeAmount = 500;
    const result = simnet.callPublicFn(
      "staking",
      "unstake",
      [`u${unstakeAmount}`],
      wallet1
    );
    expect(result.result).toBeOk(true);
  });

  it("unstaking reduces total-staked", () => {
    const unstakeAmount = 500;
    simnet.callPublicFn(
      "staking",
      "unstake",
      [`u${unstakeAmount}`],
      wallet1
    );
    
    const state = getContractState();
    expect(state.totalStaked).toBeUint(2000 - unstakeAmount);
  });

  it("user cannot unstake more than staked amount", () => {
    const result = simnet.callPublicFn(
      "staking",
      "unstake",
      ["u5000"],
      wallet1
    );
    expect(result.result).toBeErr(104);
  });

  it("user cannot unstake without having staked", () => {
    const result = simnet.callPublicFn(
      "staking",
      "unstake",
      ["u100"],
      wallet2
    );
    expect(result.result).toBeErr(103);
  });
});

// ======= UNSTAKE - ADVANCED SCENARIOS =======
describe("Unstake Function - Advanced Scenarios", () => {
  beforeEach(() => {
    // Setup: multiple users with different stakes
    simnet.callPublicFn(
      "staking",
      "stake",
      ["u1000"],
      wallet1
    );
    
    simnet.callPublicFn(
      "staking",
      "stake",
      ["u3000"],
      wallet2
    );
  });

  it("unstaking from one user doesn't affect others", () => {
    simnet.callPublicFn(
      "staking",
      "unstake",
      ["u500"],
      wallet1
    );
    
    const state = getContractState();
    expect(state.totalStaked).toBeUint(3500); // 1000 - 500 + 3000
  });

  it("user can unstake all their tokens", () => {
    const result = simnet.callPublicFn(
      "staking",
      "unstake",
      ["u1000"],
      wallet1
    );
    expect(result.result).toBeOk(true);
    
    const state = getContractState();
    expect(state.totalStaked).toBeUint(3000);
  });

  it("cannot unstake when contract is paused", () => {
    setPaused(true);
    
    const result = simnet.callPublicFn(
      "staking",
      "unstake",
      ["u100"],
      wallet1
    );
    expect(result.result).toBeErr(101);
  });
});

// ======= CLAIM REWARDS - BASIC OPERATIONS =======
describe("Claim Rewards Function - Basic Operations", () => {
  beforeEach(() => {
    // Setup: stake tokens and fund reward pool
    simnet.callPublicFn(
      "staking",
      "stake",
      ["u1000"],
      wallet1
    );
    
    // Fund reward pool
    fundRewardPool(10000);
    
    // Advance blocks to accumulate rewards
    simnet.mineEmptyBlock();
    simnet.mineEmptyBlock();
  });

  it("user can claim rewards after staking", () => {
    const result = simnet.callPublicFn(
      "staking",
      "claim",
      [],
      wallet1
    );
    expect(result.result).toBeOk(true);
  });

  it("claiming rewards returns the amount", () => {
    const result = simnet.callPublicFn(
      "staking",
      "claim",
      [],
      wallet1
    );
    expect(result.result).toBeOk(true);
    if (result.result.type === "ok") {
      expect(result.result.value).toBeUint(expect.any(Number));
    }
  });

  it("user without staking cannot claim", () => {
    const result = simnet.callPublicFn(
      "staking",
      "claim",
      [],
      wallet3
    );
    expect(result.result).toBeErr(103);
  });

  it("user with no rewards cannot claim", () => {
    // Claim all rewards first
    simnet.callPublicFn("staking", "claim", [], wallet1);
    
    // Try to claim again immediately
    const result = simnet.callPublicFn(
      "staking",
      "claim",
      [],
      wallet1
    );
    expect(result.result).toBeErr(105);
  });
});

// ======= CLAIM REWARDS - ACCUMULATION =======
describe("Claim Rewards Function - Reward Accumulation", () => {
  beforeEach(() => {
    // Setup: stake and fund reward pool
    simnet.callPublicFn(
      "staking",
      "stake",
      ["u1000"],
      wallet1
    );
    
    fundRewardPool(10000);
    
    // Advance time to accumulate rewards
    for (let i = 0; i < 10; i++) {
      simnet.mineEmptyBlock();
    }
  });

  it("rewards accumulate over time", () => {
    // Stake with wallet2 too
    simnet.callPublicFn("staking", "stake", ["u1000"], wallet2);
    
    // Claim rewards for wallet1
    const result1 = simnet.callPublicFn("staking", "claim", [], wallet1);
    expect(result1.result).toBeOk(true);
    
    // Mine more blocks
    for (let i = 0; i < 10; i++) {
      simnet.mineEmptyBlock();
    }
    
    // Claim again - should have more rewards
    const result2 = simnet.callPublicFn("staking", "claim", [], wallet1);
    expect(result2.result).toBeOk(true);
  });

  it("claiming resets pending rewards", () => {
    // Claim rewards
    const result1 = simnet.callPublicFn("staking", "claim", [], wallet1);
    expect(result1.result).toBeOk(true);
    
    // Immediately claim again (should have no new rewards yet)
    const result2 = simnet.callPublicFn("staking", "claim", [], wallet1);
    expect(result2.result).toBeErr(105);
  });

  it("multiple users can claim independently", () => {
    // Stake with wallet2
    simnet.callPublicFn("staking", "stake", ["u500"], wallet2);
    
    // Advance time
    for (let i = 0; i < 5; i++) {
      simnet.mineEmptyBlock();
    }
    
    // Both claim
    const result1 = simnet.callPublicFn("staking", "claim", [], wallet1);
    const result2 = simnet.callPublicFn("staking", "claim", [], wallet2);
    
    expect(result1.result).toBeOk(true);
    expect(result2.result).toBeOk(true);
  });
});

// ======= INTEGRATION TESTS =======
describe("Stake, Unstake, and Claim Integration Tests", () => {
  it("user can stake, earn rewards, and unstake", () => {
    // Fund reward pool first
    fundRewardPool(10000);
    
    // Stake
    const stake = simnet.callPublicFn(
      "staking",
      "stake",
      ["u1000"],
      wallet1
    );
    expect(stake.result).toBeOk(true);
    
    // Advance time for rewards
    for (let i = 0; i < 20; i++) {
      simnet.mineEmptyBlock();
    }
    
    // Claim rewards
    const claim = simnet.callPublicFn(
      "staking",
      "claim",
      [],
      wallet1
    );
    expect(claim.result).toBeOk(true);
    
    // Unstake
    const unstake = simnet.callPublicFn(
      "staking",
      "unstake",
      ["u1000"],
      wallet1
    );
    expect(unstake.result).toBeOk(true);
  });

  it("total-staked is consistent across operations", () => {
    const stakeAmount1 = 1000;
    const stakeAmount2 = 500;
    
    simnet.callPublicFn(
      "staking",
      "stake",
      [`u${stakeAmount1}`],
      wallet1
    );
    
    let state = getContractState();
    expect(state.totalStaked).toBeUint(stakeAmount1);
    
    simnet.callPublicFn(
      "staking",
      "stake",
      [`u${stakeAmount2}`],
      wallet2
    );
    
    state = getContractState();
    expect(state.totalStaked).toBeUint(stakeAmount1 + stakeAmount2);
    
    simnet.callPublicFn(
      "staking",
      "unstake",
      ["u250"],
      wallet2
    );
    
    state = getContractState();
    expect(state.totalStaked).toBeUint(stakeAmount1 + stakeAmount2 - 250);
  });
});

// ======= ADMIN FUNCTIONS =======
describe("Admin Functions", () => {
  it("owner can fund reward pool", () => {
    const fundAmount = 5000;
    const result = fundRewardPool(fundAmount);
    expect(result.result).toBeOk(true);
    
    const state = getContractState();
    expect(state.rewardPool).toBeUint(fundAmount);
  });

  it("non-owner cannot fund reward pool", () => {
    const result = simnet.callPublicFn("staking", "fund", ["u1000"], wallet1);
    expect(result.result).toBeErr(100);
  });

  it("owner can set reward rate", () => {
    const result = simnet.callPublicFn("staking", "set-rate", ["u1500"], deployer);
    expect(result.result).toBeOk(true);
  });

  it("owner cannot set rate above maximum", () => {
    const result = simnet.callPublicFn("staking", "set-rate", ["u15000"], deployer);
    expect(result.result).toBeErr(102);
  });

  it("non-owner cannot set reward rate", () => {
    const result = simnet.callPublicFn("staking", "set-rate", ["u1000"], wallet1);
    expect(result.result).toBeErr(100);
  });

  it("owner can pause and unpause contract", () => {
    // Pause
    const pauseResult = setPaused(true);
    expect(pauseResult.result).toBeOk(true);
    
    // Try to stake while paused
    const stakeResult = simnet.callPublicFn("staking", "stake", ["u1000"], wallet1);
    expect(stakeResult.result).toBeErr(101);
    
    // Unpause
    const unpauseResult = setPaused(false);
    expect(unpauseResult.result).toBeOk(true);
    
    // Should be able to stake again
    const stakeResult2 = simnet.callPublicFn("staking", "stake", ["u1000"], wallet1);
    expect(stakeResult2.result).toBeOk(true);
  });

  it("non-owner cannot pause contract", () => {
    const result = simnet.callPublicFn("staking", "set-paused", [true], wallet1);
    expect(result.result).toBeErr(100);
  });
});
