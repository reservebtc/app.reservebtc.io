// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../FeePolicy.sol";

/// @dev Broadcast with: forge script script/DeployFeePolicy.s.sol --rpc-url $RPC --private-key $PK --broadcast
contract DeployFeePolicyScript is Script {
    function run() external {
        uint256 pk = vm.envUint("PK");
        vm.startBroadcast(pk);

        // Configure your policy: pctBps, fixedWei, weiPerSat
        // Example: 0.1% (10 bps), no fixed, 1 gwei/sat
        FeePolicy policy = new FeePolicy(10, 0, 1_000_000_000);

        console2.log("FeePolicy:", address(policy));

        vm.stopBroadcast();
    }
}
