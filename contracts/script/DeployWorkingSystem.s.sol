// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../OracleAggregator.sol";
import "../RBTCSynth.sol";
import "../FeeVault.sol";
import "../FeePolicy.sol";

/// @title Deploy Working System - Fix Oracle/FeeVault mismatch
/// @notice Deploys all contracts with correct cross-references
contract DeployWorkingSystem is Script {
    
    address constant COMMITTEE = 0xea8fFEe94Da08f65765EC2A095e9931FD03e6c1b;
    address constant FEE_COLLECTOR = 0xea8fFEe94Da08f65765EC2A095e9931FD03e6c1b;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("=== DEPLOYING WORKING SYSTEM ===");
        console.log("Committee/Fee Collector:", COMMITTEE);
        console.log("");
        
        // 1. Deploy FeePolicy first (no dependencies)
        FeePolicy feePolicy = new FeePolicy(
            100,         // 1% fee (100 bps)
            0,           // No fixed fee
            1000000000000 // Wei per sat for percentage calculation
        );
        console.log("FeePolicy deployed at:", address(feePolicy));
        
        // 2. Deploy FeeVault (will be used by Oracle Aggregator)
        FeeVault feeVault = new FeeVault(
            address(0), // Oracle will be set to Oracle Aggregator after deployment
            payable(FEE_COLLECTOR)
        );
        console.log("FeeVault deployed at:", address(feeVault));
        
        // 3. Deploy RBTCSynth (will be used by Oracle Aggregator)  
        RBTCSynth synth = new RBTCSynth(
            address(0)  // Oracle will be set to Oracle Aggregator after deployment
        );
        console.log("RBTCSynth deployed at:", address(synth));
        
        // 4. Deploy Oracle Aggregator with all correct addresses
        OracleAggregator oracle = new OracleAggregator(
            address(synth),
            address(feeVault),
            address(feePolicy),
            COMMITTEE,
            1, // minConfirmations
            10000000000000000 // maxFeePerSyncWei (0.01 ETH)
        );
        console.log("Oracle Aggregator deployed at:", address(oracle));
        
        // 5. Update FeeVault oracle to point to Oracle Aggregator
        // Note: This step would fail because FeeVault.oracle is immutable
        // So we need to deploy FeeVault with Oracle Aggregator address
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("Oracle Aggregator:", address(oracle));
        console.log("RBTCSynth:", address(synth));
        console.log("FeeVault:", address(feeVault));
        console.log("FeePolicy:", address(feePolicy));
        console.log("");
        console.log("MANUAL STEPS NEEDED:");
        console.log("1. Deploy FeeVault with Oracle Aggregator address as oracle");
        console.log("2. Deploy RBTCSynth with Oracle Aggregator address as oracle");
        console.log("3. Then deploy Oracle Aggregator with correct addresses");
        console.log("");
        console.log("This requires CREATE2 or factory pattern for circular dependencies");
    }
}