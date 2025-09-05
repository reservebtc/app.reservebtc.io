// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../FeeVault.sol";

/// @title Deploy FeeVault with correct Oracle Aggregator configuration
/// @notice Creates new FeeVault where oracle = Oracle Aggregator address
contract DeployCorrectFeeVault is Script {
    // Working contract addresses
    address constant ORACLE_AGGREGATOR = 0x611AFD3808e732Ba89A0D9991d2902b0Df9bd149;
    address constant ORACLE_SERVER = 0xea8fFEe94Da08f65765EC2A095e9931FD03e6c1b;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy FeeVault with Oracle Aggregator as oracle
        FeeVault newFeeVault = new FeeVault(
            ORACLE_AGGREGATOR,        // oracle = Oracle Aggregator (can call spendFrom)
            payable(ORACLE_SERVER)    // feeCollector = Oracle server (receives fees)
        );
        
        console.log("=== New FeeVault Deployment ===");
        console.log("FeeVault address:", address(newFeeVault));
        console.log("Oracle (can spend):", newFeeVault.oracle());
        console.log("Fee Collector:", newFeeVault.feeCollector());
        console.log("");
        console.log("=== Next Steps ===");
        console.log("1. Update Oracle Aggregator to use this FeeVault");
        console.log("2. Migrate user balances from old FeeVault if needed");
        console.log("3. Test with small amount first");
        
        vm.stopBroadcast();
    }
}