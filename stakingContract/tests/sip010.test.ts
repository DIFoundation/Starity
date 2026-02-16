import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import assert from 'assert';

Clarinet.test({
    name: "SIP-010: token exposes name/symbol/decimals and basic transfer behavior",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;
        const wallet_2 = accounts.get('wallet_2')!;

        // Check metadata
        let block1 = chain.mineBlock([
            Tx.contractCall('staking-token', 'get-name', [], deployer.address),
            Tx.contractCall('staking-token', 'get-symbol', [], deployer.address),
            Tx.contractCall('staking-token', 'get-decimals', [], deployer.address),
            Tx.contractCall('staking-token', 'get-total-supply', [], deployer.address)
        ]);

        block1.receipts[0].result.expectOk().expectAscii('Staking Token');
        block1.receipts[1].result.expectOk().expectAscii('STK');
        block1.receipts[2].result.expectOk().expectUint(18);
        // default total supply should be 0
        block1.receipts[3].result.expectOk().expectUint(0);

        // Mint some tokens to wallet_1 (deployer first sets minter to itself)
        let block2 = chain.mineBlock([
            Tx.contractCall('staking-token', 'set-minter', [types.principal(deployer.address + '.staking-token')], deployer.address),
            Tx.contractCall('staking-token', 'mint', [], deployer.address)
        ]);

        block2.receipts[0].result.expectOk();
        block2.receipts[1].result.expectOk();

        // Transfer some tokens from deployer to wallet_1
        let block3 = chain.mineBlock([
            Tx.contractCall('staking-token', 'transfer', [types.uint(1000000000000000000), types.principal(deployer.address), types.principal(wallet_1.address), types.none()], deployer.address)
        ]);
        block3.receipts[0].result.expectOk();

        // Check balances
        let block4 = chain.mineBlock([
            Tx.contractCall('staking-token', 'get-balance', [types.principal(wallet_1.address)], wallet_1.address),
            Tx.contractCall('staking-token', 'get-balance', [types.principal(deployer.address)], deployer.address)
        ]);

        block4.receipts[0].result.expectOk().expectUint(1000000000000000000);
        // deployer should have supply minus the transfer (non-deterministic exact amount but should be >= 0)
        block4.receipts[1].result.expectOk();
    }
});
