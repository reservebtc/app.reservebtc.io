// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../OracleAggregator.sol";

/// @dev Broadcast with: forge script script/DeployOracleAggregator.s.sol --rpc-url $RPC --private-key $PK --broadcast
contract DeployOracleAggregatorScript is Script {
    function run() external {
        uint256 pk = vm.envUint("PK");
        address synth = vm.envAddress("RBTC_SYNTH");
        address feeVault = vm.envAddress("FEE_VAULT");
        address feePolicy = vm.envAddress("FEE_POLICY");
        address committee = vm.envAddress("COMMITTEE");
        uint256 minConf = vm.envUint("MIN_CONFIRMATIONS"); // e.g., 3
        uint256 maxFee = vm.envUint("MAX_FEE_PER_SYNC_WEI"); // e.g., 100000000000 (1e11)

        vm.startBroadcast(pk);

        OracleAggregator agg = new OracleAggregator(synth, feeVault, feePolicy, committee, minConf, maxFee);

        console2.log("OracleAggregator:", address(agg));
        console2.log("synth:", synth);
        console2.log("feeVault:", feeVault);
        console2.log("feePolicy:", feePolicy);
        console2.log("committee:", committee);
        console2.log("minConfirmations:", minConf);
        console2.log("maxFeePerSyncWei:", maxFee);

        vm.stopBroadcast();
    }
}
