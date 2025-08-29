// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../FeeVault.sol";

/// @dev Broadcast with: forge script script/DeployFeeVault.s.sol --rpc-url $RPC --private-key $PK --broadcast
contract DeployFeeVaultScript is Script {
    function run() external {
        uint256 pk = vm.envUint("PK");
        address oracle = vm.envAddress("ORACLE");
        address payable feeCollector = payable(vm.envAddress("FEE_COLLECTOR"));

        vm.startBroadcast(pk);

        FeeVault vault = new FeeVault(oracle, feeCollector);

        console2.log("FeeVault:", address(vault));
        console2.log("oracle:", oracle);
        console2.log("feeCollector:", feeCollector);

        vm.stopBroadcast();
    }
}
