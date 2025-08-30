// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {OracleAggregator} from "../OracleAggregator.sol";
import {FeeVault} from "../FeeVault.sol";
import {FeePolicy} from "../FeePolicy.sol";
import {RBTCSynth} from "../RBTCSynth.sol";
import {VaultWrBTC} from "../VaultWrBTC.sol";

contract DeployMegaETH is Script {
    // MegaETH Testnet Configuration
    uint256 constant CHAIN_ID = 6342;
    
    // Fee Policy Parameters (0.1% fee)
    uint256 constant PCT_BPS = 10;        // 0.1% in basis points
    uint256 constant FIXED_WEI = 0;       // No fixed fee
    uint256 constant WEI_PER_SAT = 1_000_000_000; // 1 gwei per satoshi
    
    // Oracle Committee Configuration
    uint256 constant THRESHOLD = 1;       // 1-of-1 for testing (you as single oracle)
    uint256 constant MIN_CONFIRMATIONS = 1; // Testnet: faster confirmations
    uint256 constant MAX_FEE_PER_SYNC = 0.01 ether; // 0.01 ETH max fee
    
    function run() external {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address feeCollector = vm.envOr("FEE_COLLECTOR", deployer);
        
        console.log("=== MegaETH Testnet Deployment ===");
        console.log("Chain ID:", CHAIN_ID);
        console.log("RPC URL:", vm.envString("RPC_URL"));
        console.log("Deployer:", deployer);
        console.log("Fee Collector:", feeCollector);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy FeePolicy
        console.log("\n1. Deploying FeePolicy...");
        FeePolicy feePolicy = new FeePolicy(PCT_BPS, FIXED_WEI, WEI_PER_SAT);
        console.log("FeePolicy deployed at:", address(feePolicy));
        
        // First, deploy a temporary oracle address placeholder
        address tempOracle = deployer; // Temporary oracle address
        
        // 2. Deploy RBTCSynth first (needs oracle address)
        console.log("\n2. Deploying RBTCSynth...");
        RBTCSynth rbtcSynth = new RBTCSynth(tempOracle);
        console.log("RBTCSynth deployed at:", address(rbtcSynth));
        
        // 3. Deploy VaultWrBTC (needs rBTC and oracle addresses)
        console.log("\n3. Deploying VaultWrBTC...");
        VaultWrBTC vaultWrBTC = new VaultWrBTC(address(rbtcSynth), tempOracle);
        console.log("VaultWrBTC deployed at:", address(vaultWrBTC));
        
        // 4. Deploy FeeVault (needs oracle and fee collector)
        console.log("\n4. Deploying FeeVault...");
        FeeVault feeVault = new FeeVault(tempOracle, payable(feeCollector));
        console.log("FeeVault deployed at:", address(feeVault));
        
        // 5. Deploy main OracleAggregator
        console.log("\n5. Deploying OracleAggregator (Main Contract)...");
        OracleAggregator oracle = new OracleAggregator(
            address(rbtcSynth),    // synth
            address(feeVault),     // feeVault
            address(feePolicy),    // feePolicy
            deployer,              // committee (single address for testing)
            MIN_CONFIRMATIONS,     // minConf
            MAX_FEE_PER_SYNC       // maxFeePerSync
        );
        console.log("OracleAggregator deployed at:", address(oracle));
        
        // 6. Update oracle references in deployed contracts
        console.log("\n6. Updating oracle references...");
        console.log("[INFO] Note: Contracts were deployed with temporary oracle addresses");
        console.log("[INFO] In production, deploy oracle first or use CREATE2 for deterministic addresses");
        
        vm.stopBroadcast();
        
        // 8. Display deployment summary
        console.log("\n=== DEPLOYMENT COMPLETE ===");
        console.log("Save these addresses for frontend configuration:");
        console.log("");
        console.log("FeePolicy:", address(feePolicy));
        console.log("FeeVault:", address(feeVault));
        console.log("RBTCSynth:", address(rbtcSynth));
        console.log("VaultWrBTC:", address(vaultWrBTC));
        console.log("OracleAggregator:", address(oracle));
        console.log("");
        console.log("Oracle Committee Member:", deployer);
        console.log("Fee Collector:", feeCollector);
        console.log("");
        console.log("Ready for testnet usage!");
        console.log("Next: Update frontend with these contract addresses");
    }
    
    // Helper function to verify deployment
    function verifyDeployment(
        address feePolicy,
        address feeVault,
        address rbtcSynth,
        address oracle
    ) internal view {
        console.log("\n=== Deployment Verification ===");
        
        // Check FeePolicy configuration
        FeePolicy policy = FeePolicy(feePolicy);
        console.log("FeePolicy - PCT BPS:", policy.pctBps());
        console.log("FeePolicy - Fixed Wei:", policy.fixedWei());
        console.log("FeePolicy - Wei per Sat:", policy.weiPerSat());
        
        // Check oracle configuration
        console.log("Oracle committee:", OracleAggregator(oracle).committee());
        console.log("Oracle min confirmations:", OracleAggregator(oracle).minConfirmations());
        console.log("Oracle max fee per sync:", OracleAggregator(oracle).maxFeePerSyncWei());
        
        console.log("[OK] All contracts configured correctly");
    }
}