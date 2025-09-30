// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import "../YieldScalesPool.sol";

/**
 * @title DeployYieldScalesPoolFixed
 * @notice Deploy YieldScalesPool with CORRECT Oracle address
 */
contract DeployYieldScalesPoolFixed is Script {
    
    // Current working addresses
    address constant RBTC_SYNTH = 0x5b9375b4ac0f61C7D5af32374aCCe0d058cE6F58;
    address constant FEE_VAULT = 0x1384d3A60a910B5b402ee09457b3eBfCC964FD4f;
    address constant ORACLE_AGGREGATOR = 0xEcCC1Bf6Ad2e875152eE65DC365F90d07da7aEAc;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console2.log("==============================================");
        console2.log("Deploy YieldScalesPool with CORRECT references");
        console2.log("==============================================");
        console2.log("Deployer:", deployer);
        console2.log("");
        console2.log("Using addresses:");
        console2.log("  RBTCSynth:        ", RBTC_SYNTH);
        console2.log("  FeeVault:         ", FEE_VAULT);
        console2.log("  OracleAggregator: ", ORACLE_AGGREGATOR);
        console2.log("==============================================\n");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy YieldScalesPool with CORRECT Oracle address
        YieldScalesPool yieldScalesPool = new YieldScalesPool(
            RBTC_SYNTH,           // RBTCSynth address
            FEE_VAULT,            // FeeVault address
            ORACLE_AGGREGATOR     // CORRECT Oracle address (NOT committee!)
        );
        
        console2.log("YieldScalesPool deployed at:", address(yieldScalesPool));
        
        // Verify configuration
        require(address(yieldScalesPool.rbtcSynth()) == RBTC_SYNTH, "Wrong RBTCSynth");
        require(address(yieldScalesPool.feeVault()) == FEE_VAULT, "Wrong FeeVault");
        require(yieldScalesPool.oracle() == ORACLE_AGGREGATOR, "Wrong Oracle");
        
        console2.log("\nConfiguration verified!");
        console2.log("  rbtcSynth() ->", address(yieldScalesPool.rbtcSynth()));
        console2.log("  feeVault()  ->", address(yieldScalesPool.feeVault()));
        console2.log("  oracle()    ->", yieldScalesPool.oracle());
        
        vm.stopBroadcast();
        
        console2.log("\n==============================================");
        console2.log("DEPLOYMENT SUCCESSFUL!");
        console2.log("==============================================");
        console2.log("\nNEW YieldScalesPool:", address(yieldScalesPool));
        console2.log("\nExplorer:");
        console2.log("https://www.megaexplorer.xyz/address/", address(yieldScalesPool));
        console2.log("\n==============================================");
        console2.log("NEXT STEPS:");
        console2.log("==============================================");
        console2.log("1. Update app/lib/contracts.ts");
        console2.log("2. Update Oracle server config");
        console2.log("3. Update documentation");
        console2.log("4. Run health check to verify");
        console2.log("==============================================\n");
    }
}