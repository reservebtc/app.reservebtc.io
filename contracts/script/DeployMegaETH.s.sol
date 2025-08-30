// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {OracleAggregator} from "../src/OracleAggregator.sol";
import {FeeVault} from "../src/FeeVault.sol";
import {FeePolicy} from "../src/FeePolicy.sol";
import {RBTCSynth} from "../src/RBTCSynth.sol";
import {VaultWrBTC} from "../src/VaultWrBTC.sol";

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
        
        // 2. Deploy FeeVault
        console.log("\n2. Deploying FeeVault...");
        FeeVault feeVault = new FeeVault(feeCollector);
        console.log("FeeVault deployed at:", address(feeVault));
        
        // 3. Deploy RBTCSynth (soulbound rBTC)
        console.log("\n3. Deploying RBTCSynth...");
        RBTCSynth rbtcSynth = new RBTCSynth();
        console.log("RBTCSynth deployed at:", address(rbtcSynth));
        
        // 4. Deploy VaultWrBTC (wrapped rBTC)
        console.log("\n4. Deploying VaultWrBTC...");
        VaultWrBTC vaultWrBTC = new VaultWrBTC();
        console.log("VaultWrBTC deployed at:", address(vaultWrBTC));
        
        // 5. Prepare committee (single member for testing)
        address[] memory committee = new address[](1);
        committee[0] = deployer; // You are the oracle
        
        // 6. Deploy main OracleAggregator
        console.log("\n5. Deploying OracleAggregator (Main Contract)...");
        OracleAggregator oracle = new OracleAggregator(
            address(feePolicy),
            address(feeVault),
            address(rbtcSynth),
            committee,
            THRESHOLD,
            MIN_CONFIRMATIONS,
            MAX_FEE_PER_SYNC
        );
        console.log("OracleAggregator deployed at:", address(oracle));
        
        // 7. Configure permissions
        console.log("\n6. Configuring contract permissions...");
        
        // Set oracle as minter for RBTCSynth
        rbtcSynth.setOracle(address(oracle));
        console.log("✅ RBTCSynth oracle set to:", address(oracle));
        
        // Configure VaultWrBTC if needed
        vaultWrBTC.initialize(address(rbtcSynth), address(oracle));
        console.log("✅ VaultWrBTC initialized");
        
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
        console.log("🎉 Ready for testnet usage!");
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
        (uint256 pct, uint256 fixed, uint256 weiPerSat) = FeePolicy(feePolicy).getFeeParams();
        console.log("FeePolicy - PCT BPS:", pct);
        console.log("FeePolicy - Fixed Wei:", fixed);
        console.log("FeePolicy - Wei per Sat:", weiPerSat);
        
        // Check oracle configuration
        console.log("Oracle threshold:", OracleAggregator(oracle).threshold());
        console.log("Oracle committee size:", OracleAggregator(oracle).getCommitteeSize());
        
        console.log("✅ All contracts configured correctly");
    }
}