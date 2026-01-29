import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
// import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import assert from 'assert';

Clarinet.test({
    name: "Ensure user can stake and earn 20% APR over one year",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;
        const amount = 1000000000000000000000; // 1,000 STK (18 decimals)
        const yearInSeconds = 31536000;

        // 1. Setup: Authorize the Vault to mint rewards
        let block1 = chain.mineBlock([
            Tx.contractCall('staking-token', 'set-minter', [types.principal(deployer.address + '.staking-vault')], deployer.address),
            Tx.contractCall('staking-token', 'mint', [], wallet_1.address)
        ]);
        block1.receipts[0].result.expectOk();

        // 2. Stake tokens
        let block2 = chain.mineBlock([
            Tx.contractCall('staking-vault', 'stake', [
                types.principal(deployer.address + '.staking-token'),
                types.uint(amount)
            ], wallet_1.address)
        ]);
        block2.receipts[0].result.expectOk();

        // 3. FAST FORWARD: Simulate 1 year of time
        chain.mineEmptyBlockUntil(chain.blockHeight + (yearInSeconds / 600)); // Approx blocks

        // 4. Claim rewards
        let block3 = chain.mineBlock([
            Tx.contractCall('staking-vault', 'claim-rewards', [
                types.principal(deployer.address + '.staking-token')
            ], wallet_1.address)
        ]);
        
        // 5. Verification: 20% of 1000 is 200
        const claimedAmount = block3.receipts[0].result.expectOk();
        const expectedReward = 200000000000000000000; // 200 tokens
        
        // Allow for slight rounding due to block timing
        assert(Number(claimedAmount) >= expectedReward);
    },
});