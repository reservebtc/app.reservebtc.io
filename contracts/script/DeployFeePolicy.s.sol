// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {FeePolicy} from "../FeePolicy.sol";

contract DeployFeePolicy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        console.log("=== Deploying FeePolicy ===");
        
        // Conservative fee parameters:
        uint256 pctBps = 100;      // 1% percentage fee (100 basis points)
        uint256 fixedWei = 0.001 ether;  // 0.001 ETH fixed fee per sync
        uint256 weiPerSat = 1e12;  // 1e12 wei per sat (reasonable conversion)
        
        console.log("Parameters:");
        console.log("  pctBps (1%):", pctBps);
        console.log("  fixedWei:", fixedWei);
        console.log("  weiPerSat:", weiPerSat);
        console.log("");
        
        vm.startBroadcast(deployerPrivateKey);
        
        FeePolicy feePolicy = new FeePolicy(pctBps, fixedWei, weiPerSat);
        
        vm.stopBroadcast();
        
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("FeePolicy deployed at:", address(feePolicy));
        console.log("");
        console.log("NEXT: Update OracleAggregator to use this FeePolicy address");
        console.log("Replace: 0x8ab5c6a52ba1A97E3F2cFFA1b2fe15d5FfF3d6b2");
        console.log("With:   ", address(feePolicy));
        
        // Test the fee calculation
        testFeeCalculation(address(feePolicy));
    }
    
    function testFeeCalculation(address feePolicy) internal view {
        console.log("");
        console.log("=== Testing Fee Calculation ===");
        
        FeePolicy policy = FeePolicy(feePolicy);
        
        // Test positive delta (minting) - should charge fees
        uint256 mintFee = policy.quoteFees(address(0), 50000);
        console.log("Fee for +50000 sats:", mintFee, "wei");
        
        // Test negative delta (burning) - should be zero
        uint256 burnFee = policy.quoteFees(address(0), -10000);
        console.log("Fee for -10000 sats:", burnFee, "wei");
        
        if (mintFee > 0 && burnFee == 0) {
            console.log("OK FeePolicy working correctly!");
        } else {
            console.log("FeePolicy may have issues");
        }
    }
}