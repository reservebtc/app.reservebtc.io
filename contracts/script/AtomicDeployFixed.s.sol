// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {RBTCSynth} from "../RBTCSynth.sol";
import {OracleAggregator} from "../OracleAggregator.sol";
import {FeeVault} from "../FeeVault.sol";

/// @title Atomic Deploy Fixed - Deploy all three contracts with correct cross-references
/// @notice Solves circular dependency: Oracle ↔ FeeVault ↔ RBTCSynth
contract AtomicDeployFixed is Script {
    // MegaETH Testnet Configuration
    uint256 constant CHAIN_ID = 6342;
    
    // Existing working contract
    address constant FEE_POLICY = 0xc10fD3a2DF480CFAE8a7aBC2862a9c5724f5f4b4;
    
    // Oracle configuration  
    uint256 constant MIN_CONFIRMATIONS = 1;
    uint256 constant MAX_FEE_PER_SYNC = 0.01 ether;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address committee = deployer;
        address feeCollector = deployer;
        
        console.log("=== ATOMIC DEPLOYMENT WITH EMERGENCY BURN PROTECTION ===");
        console.log("Chain ID:", CHAIN_ID);
        console.log("Deployer/Committee:", deployer);
        console.log("Fee Collector:", feeCollector);
        console.log("Deployer nonce:", vm.getNonce(deployer));
        console.log("");
        
        // SOLUTION: Predict all three addresses using nonce
        uint64 nonce = vm.getNonce(deployer);
        
        address predictedFeeVault = computeCreateAddress(deployer, nonce);
        address predictedOracleAgg = computeCreateAddress(deployer, nonce + 1);
        address predictedRBTCSynth = computeCreateAddress(deployer, nonce + 2);
        
        console.log("PREDICTED FeeVault:        ", predictedFeeVault);
        console.log("PREDICTED OracleAggregator:", predictedOracleAgg);
        console.log("PREDICTED RBTCSynth:       ", predictedRBTCSynth);
        console.log("");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // STEP 1: Deploy FeeVault with predicted Oracle address
        console.log("STEP 1: Deploying FeeVault...");
        FeeVault feeVault = new FeeVault(
            predictedOracleAgg,           // oracle = predicted Oracle Aggregator
            payable(feeCollector)         // feeCollector = deployer
        );
        
        // STEP 2: Deploy OracleAggregator with predicted RBTCSynth and actual FeeVault
        console.log("STEP 2: Deploying OracleAggregator with emergency burn...");
        OracleAggregator oracle = new OracleAggregator(
            predictedRBTCSynth,           // predicted synth address
            address(feeVault),            // actual feeVault address
            FEE_POLICY,                   // existing working feePolicy
            committee,                    // committee (deployer)
            MIN_CONFIRMATIONS,            // minConf
            MAX_FEE_PER_SYNC              // maxFeePerSync
        );
        
        // STEP 3: Deploy RBTCSynth with actual OracleAggregator address
        console.log("STEP 3: Deploying RBTCSynth...");
        RBTCSynth rbtcSynth = new RBTCSynth(address(oracle));
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("FeeVault:         ", address(feeVault));
        console.log("OracleAggregator: ", address(oracle));
        console.log("RBTCSynth:        ", address(rbtcSynth));
        console.log("");
        
        // Verify predictions were correct
        bool feeVaultCorrect = (address(feeVault) == predictedFeeVault);
        bool oracleCorrect = (address(oracle) == predictedOracleAgg);
        bool synthCorrect = (address(rbtcSynth) == predictedRBTCSynth);
        
        console.log("PREDICTION RESULTS:");
        console.log("   FeeVault:  ", feeVaultCorrect ? "CORRECT" : "FAILED");
        console.log("   Oracle:    ", oracleCorrect ? "CORRECT" : "FAILED");  
        console.log("   RBTCSynth: ", synthCorrect ? "CORRECT" : "FAILED");
        console.log("");
        
        if (feeVaultCorrect && oracleCorrect && synthCorrect) {
            verifyDeployment(payable(address(feeVault)), address(oracle), address(rbtcSynth));
        } else {
            console.log("PREDICTION FAILED - Cross-references may be incorrect!");
        }
    }
    
    function verifyDeployment(address payable feeVaultAddr, address oracleAddr, address synthAddr) internal view {
        console.log("=== CROSS-REFERENCE VERIFICATION ===");
        
        FeeVault vault = FeeVault(feeVaultAddr);
        OracleAggregator agg = OracleAggregator(oracleAddr);
        RBTCSynth synth = RBTCSynth(synthAddr);
        
        // Check all cross-references
        address vaultOracle = vault.oracle();
        address vaultFeeCollector = vault.feeCollector();
        
        address aggSynth = address(agg.synth());
        address aggFeeVault = address(agg.feeVault());
        address aggCommittee = agg.committee();
        
        address synthOracle = synth.oracle();
        
        console.log("FeeVault checks:");
        console.log("   Oracle:        ", vaultOracle, vaultOracle == oracleAddr ? "OK" : "ERR");
        console.log("   Fee Collector: ", vaultFeeCollector);
        
        console.log("Oracle checks:");
        console.log("   Synth:         ", aggSynth, aggSynth == synthAddr ? "OK" : "ERR");
        console.log("   FeeVault:      ", aggFeeVault, aggFeeVault == feeVaultAddr ? "OK" : "ERR");
        console.log("   Committee:     ", aggCommittee);
        
        console.log("RBTCSynth checks:");
        console.log("   Oracle:        ", synthOracle, synthOracle == oracleAddr ? "OK" : "ERR");
        
        // Final verdict
        bool allCorrect = (vaultOracle == oracleAddr) && 
                         (aggSynth == synthAddr) && 
                         (aggFeeVault == feeVaultAddr) && 
                         (synthOracle == oracleAddr);
        
        console.log("");
        if (allCorrect) {
            console.log("PERFECT! ALL CONTRACTS PROPERLY LINKED!");
            console.log("Emergency burn protection enabled!");
            console.log("");
            console.log("FINAL WORKING ADDRESSES:");
            console.log("   FeeVault:         ", feeVaultAddr);
            console.log("   OracleAggregator: ", oracleAddr);
            console.log("   RBTCSynth:        ", synthAddr);
            console.log("   FeePolicy:        ", FEE_POLICY, "(reusing existing)");
        } else {
            console.log("CROSS-REFERENCE ERRORS DETECTED!");
        }
    }
}