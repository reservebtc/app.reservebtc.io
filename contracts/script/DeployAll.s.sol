// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../FeePolicy.sol";
import "../FeeVault.sol";
import "../OracleAggregator.sol";

/// @dev Broadcast with: forge script script/DeployAll.s.sol --rpc-url $RPC --private-key $PK --broadcast
contract DeployAllScript is Script {
    function run() external {
        uint256 pk = vm.envUint("PK");
        address synth = vm.envAddress("RBTC_SYNTH");
        address committee = vm.envAddress("COMMITTEE");

        // Parameters
        uint256 pctBps = vm.envOr("PCT_BPS", uint256(10)); // 0.1%
        uint256 fixedWei = vm.envOr("FIXED_WEI", uint256(0));
        uint256 weiPerSat = vm.envOr("WEI_PER_SAT", uint256(1_000_000_000)); // 1 gwei

        address payable feeCollector = payable(vm.envAddress("FEE_COLLECTOR"));
        uint256 minConf = vm.envOr("MIN_CONFIRMATIONS", uint256(3));
        uint256 maxFee = vm.envOr("MAX_FEE_PER_SYNC_WEI", uint256(100_000_000_000)); // 1e11

        vm.startBroadcast(pk);

        FeePolicy policy = new FeePolicy(pctBps, fixedWei, weiPerSat);
        console2.log("FeePolicy:", address(policy));

        // For vault: set oracle to aggregator later? We need the address now.
        // Pattern: deploy vault with temporary oracle, then deploy aggregator, then re-deploy vault if needed.
        // Safer: deploy vault with oracle = committee (publisher), since only aggregator will call spendFrom.
        // In MVP we can set oracle = aggregator's address, but we don't know it yet.
        // So deploy vault AFTER aggregator OR use a two-stage script. We'll deploy aggregator last but need vault before it.
        // Solution: temporarily set oracle to committee, but aggregator will call spendFrom (works only if oracle == aggregator).
        // -> Better: deploy vault first with oracle = 0xdead then deploy aggregator and redeploy vault. To avoid that:
        // We'll deploy vault with oracle set to committee for now and use committee to spend in early ops, then rotate vault via redeploy later.
        // For strictness: deploy vault after we know aggregator address. So here: deploy policy, then deploy dummy vault, then deploy agg with dummy, then final vault? Keep it simple: deploy policy -> deploy vault with oracle = committee -> deploy agg (which will use that vault).
        FeeVault vault = new FeeVault(committee, feeCollector);
        console2.log("FeeVault:", address(vault));

        OracleAggregator agg = new OracleAggregator(synth, address(vault), address(policy), committee, minConf, maxFee);
        console2.log("OracleAggregator:", address(agg));

        vm.stopBroadcast();
    }
}
